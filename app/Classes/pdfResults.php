<?php

namespace App\Classes;
use App\Models\Competition;
use App\Models\Result;
use App\Models\Station;

class CustomPdf extends BasePDF {

    public $weaponclasses_id;
    public $Competition;
    public $filter;

    //Page header
    public function Header() {
        $logotype = $this->Competition->pdf_logo_path;
        $logoDimensions = $this->getLogoDimensions($logotype);
        
        $this->Image($logotype, $this->GetX(), $this->GetY(), 0, 15);

        $this->SetFont('helvetica', '', 20);
        $this->RoundedRect(108, 10, 92, 18, 2, '1111', 'F',null, [240,240,240]);
        $this->SetX(110);
        $this->cell(88, 0, _('Resultat'), '', 0, 'L');
        $this->SetX(110);
        $this->cell(88, 0, $this->Competition->date, '', 0, 'R');

        $this->SetFont('helvetica', '', 11);
        $this->SetXY(110, $this->GetY()+10);
        $this->Competition->fullname = ($this->Competition->Championship) ? $this->Competition->Championship->name : $this->Competition->name;
        $this->cell(70, 0, $this->Competition->fullname, '', 0, 'L');
        $description = $this->Competition->Competitiontype->name;
        if($this->filter->pagebreak):
            $description .= ': ';
            foreach($this->Competition->Weaponclasses as $weaponclass):
                if($this->weaponclasses_id && $weaponclass->id == $this->weaponclasses_id):
                    $description .= ($this->Competition->championships_id) ? $weaponclass->classname_general : $weaponclass->classname.' ';
                endif;
            endforeach;
        endif;
        $this->SetX(110);
        $this->cell(88, 0, $description, '', 0, 'R');
    }

    public function Footer() {
        $this->SetXY(10, 272);
        $this->line(10, 270, 210-10, 270, ['width'=>0.1,'color'=>[150,150,150]]);
        $this->SetTextColor(100,100,100);
        $this->SetFont('helvetica', '', 8);
        $this->SetXY(10, 272);
        $this->Competition->fullname = ($this->Competition->Championship) ? $this->Competition->Championship->name : $this->Competition->name;
        $this->Competition->fullname .= ' - ';
        $this->Competition->fullname .= $this->Competition->Competitiontype->name;
        $this->Competition->fullname .= ' - ';
        $this->Competition->fullname .= $this->Competition->date;

        $this->cell(70, 6, $this->Competition->fullname, 0, 0, 'L', false );
        $this->SetXY(10, 272+5);
        $this->cell(70, 6, _('© Webshooter LM AB - webshooter.se'), 0, 0, 'L', false );
        $this->SetXY(10, 272);
        $this->Cell(200, 6, _('Sida ').$this->getPageNumGroupAlias().'/'.$this->getPageGroupAlias(), '', 0, 'C');
        $this->SetX(190);
        
        $this->addFooterLogotype($this);
    }
}

class pdfResults
{
    public function __construct() {
        $this->leftMargin = 10;
        $this->topMargin = 10;
        $this->footerMargin = 30;
        $this->fontSize = 10;
        $this->fontColor = '30';
        $this->borderRadius = 2;
        $this->fillColor = [240,240,240];
        $this->lineColor = [150,150,150];
        $this->lineWidth = 0.1;
        $this->color1 = '#ffffff';
        $this->color2 = '#f0f0f0';
        $this->cellsWidth = [10, 38, 45, 10, 83]; //186
    }

    /**
     * Init the pdf
     */
    private function pdfSettings($pdf)
    {
        $pdf->SetPrintHeader(true);
        $pdf->SetPrintFooter(true);
        $pdf->SetHeaderMargin($this->topMargin);
        $pdf->setFooterMargin($this->footerMargin);
        $pdf->setLeftMargin($this->leftMargin);
        $pdf->setRightMargin($this->leftMargin);
        $pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_TOP+5, PDF_MARGIN_RIGHT);
        $pdf->SetAutoPageBreak(true, $this->footerMargin);
        $pdf->SetAuthor('Author');
        $pdf->SetDisplayMode('real', 'default');
        $pdf->SetFont('helvetica', '', $this->fontSize);
        $pdf->SetTextColor($this->fontColor);
    }

    public function create($competitionsId, $output, $download = true)
    {

        $this->pdf = new CustomPdf();
        $this->pdfSettings($this->pdf);

        $this->competitionsId = $competitionsId;
        $this->filter = new \stdClass();
        $this->filter->pagebreak = (isset($output['pagebreak'])) ? $output['pagebreak'] : false;
        $this->filter->std_medals = (isset($output['std_medals'])) ? $output['std_medals'] : false;
        $this->filter->prices = (isset($output['prices'])) ? $output['prices'] : false;

        $this->destination = 'I';
        $this->Competition = Competition::with([
            'Club',
            'Club.District',
            'Championship',
            'Sponsors',
            'Signups'=>function($query){
                $query->select('competitions_signups.*')
                    ->join('results_placements', 'results_placements.signups_id', '=', 'competitions_signups.id')
                    ->orderBy(\DB::raw('results_placements.placement = 0, results_placements.placement'));
                $query->orderBy('weaponclasses_id');
            },
            'Signups.Club',
            'Signups.User',
            'Signups.Weaponclass',
            'Signups.Results'=>function($query){
                $query->where('finals', 0);
                $query->where('distinguish', 0);
                $query->orderBy('stations_id');
            },
            'Signups.ResultsPlacements',
            'Stations',
            'Competitiontype',
            'Weaponclasses',
        ])
        ->find($competitionsId);
        $this->pdf->Competition = $this->Competition;

        if($this->Competition->results_type == 'military'):
            $this->resultsMilitary();
        elseif($this->Competition->results_type == 'precision'):
            $this->resultsPrecision();
        elseif($this->Competition->results_type == 'field'):
            $this->resultsField();
        elseif($this->Competition->results_type == 'pointfield'):
            $this->resultsPointfield();
        elseif($this->Competition->results_type == 'magnum'):
            $this->resultsMagnum();
        endif;

        if($this->Competition->results_comment) $this->resultsComment();

        if(count($this->Competition->Sponsors)):
            $cp = $this->pdf->getPage();
            $this->pdf->startTransaction();
            $this->resultsSponsors();
            if($this->pdf->getPage() > $cp):
                $this->pdf->rollbackTransaction(true);
                $this->pageHeader();
                $this->resultsSponsors();
            else:
                $this->pdf->commitTransaction();
            endif;
        endif;

        $pdfFilePath = storage_path().'/app/competitions/'.$competitionsId.'/results/webshooter-resultat-'.$competitionsId.'.pdf';
        $this->pdf->Output($pdfFilePath,'F');

        if($download){
            return $this->pdf->Output('webshooter-resultat-'.$competitionsId.'.pdf','I');    
        }
    }

    public function pageHeader($weaponclasses_id=null)
    {
        $this->pdf->weaponclasses_id = $weaponclasses_id;
        $this->pdf->filter = $this->filter;
        $this->pdf->startPageGroup();
        $this->pdf->AddPage();
    }

    public function resultsMilitary()
    {
        $weaponclasses = $this->Competition->Signups->groupBy('weaponclasses_id');
        $i = 0;
        foreach($weaponclasses as $index => $weaponclass):

            if($weaponclass):
                if($this->filter->pagebreak || $i == 0) $this->pageHeader($index);
                $numberOfResultsColumns = 16;
                $numberOfResultsColumns = ($this->filter->std_medals) ? $numberOfResultsColumns + 1 : $numberOfResultsColumns;
                $numberOfResultsColumns = ($this->Competition->results_prices && $this->filter->prices) ? $numberOfResultsColumns + 2 : $numberOfResultsColumns;
                /**
                 * Heading columns
                 */
                $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY(), 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
                $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+1);

                $this->pdf->cell($this->cellsWidth[0], 6, _('Plats'), '', 0, 'R' );
                $this->pdf->cell($this->cellsWidth[1], 6, _('Namn'), '', 0, 'L' );
                $this->pdf->cell($this->cellsWidth[2], 6, _('Förening'), '', 0, 'L' );
                $this->pdf->cell($this->cellsWidth[3], 6, _('Vapengrupp'), '', 0, 'R' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 1, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 2, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 3, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 4, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 5, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 6, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 7, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 8, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 9, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 10, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 11, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 12, '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 6, 'Tot', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'X', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'SK', '', 0, 'C' );
                if($this->filter->std_medals):
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'M', '', 0, 'R' );
                endif;
                if($this->Competition->results_prices && $this->filter->prices):
                    $this->pdf->cell(($this->cellsWidth[4]/$numberOfResultsColumns)*2, 6, 'Pris', '', 0, 'R' );
                endif;
                $this->pdf->ln();

                $this->pdf->SetY($this->pdf->GetY()+4);

                $weaponclass->each(function($signup, $index) use ($numberOfResultsColumns){
                    $totals = [0,0,0];

                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    $this->pdf->SetX($this->leftMargin+2);
                    $this->pdf->cell($this->cellsWidth[0], 4, $signup->ResultsPlacements->placement, '', 0, 'R' );
                    $this->pdf->cell($this->cellsWidth[1], 4, $signup->User->fullName, '', 0, 'L' );
                    $this->pdf->cell($this->cellsWidth[2], 4, substr($signup->Club->name, 0, 33), '', 0, 'L' );
                    $this->pdf->cell($this->cellsWidth[3], 4, ($this->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname, '', 0, 'R' );

                    /**
                     * Results for 10s stage in military.
                     */
                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    for($i=1; $i<=4; $i++):
                        $points = $signup->Results->where('stations_id', $i)->pluck('points');
                        if(count($points)):
                            $totals[0] += $points[0];
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $points[0], '', 0, 'C' );
                        else:
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, 0, '', 0, 'C' );
                        endif;
                    endfor;

                    /**
                     * Results for 8s stage in military.
                     */
                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    for($i=5; $i<=8; $i++):
                        $points = $signup->Results->where('stations_id', $i)->pluck('points');
                        if(count($points)):
                            $totals[1] += $points[0];
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $points[0], '', 0, 'C' );
                        else:
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, 0, '', 0, 'C' );
                        endif;
                    endfor;

                    /**
                     * Results for 8s stage in military.
                     */
                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    for($i=9; $i<=12; $i++):
                        $points = $signup->Results->where('stations_id', $i)->pluck('points');
                        if(count($points)):
                            $totals[2] += $points[0];
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $points[0], '', 0, 'C' );
                        else:
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, 0, '', 0, 'C' );
                        endif;
                    endfor;


                    /**
                     * Totals
                     */
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 4, $totals[0]+$totals[1]+$totals[2], '', 0, 'C' );

                    /**
                     * Number of hits on Center X.
                     */
                    $hits = $signup->Results->sum(function($result){
                        return $result->hits;
                    });
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, ($hits) ? $hits : '', '', 0, 'C' );

                    /**
                     * Distinguish points
                     */
                    $distinguish_points = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('points');
                    $distinguish_points = ($distinguish_points) ? $distinguish_points : '';
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $distinguish_points, '', 0, 'C' );

                    /**
                     * Standard Medal
                     */
                    if($this->filter->std_medals):
                        $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $signup->ResultsPlacements->std_medal, '', 0, 'R' );
                    endif;

                    /**
                     * Price
                     */
                    if($this->Competition->results_prices && $this->filter->prices):
                        $this->pdf->cell(($this->cellsWidth[4]/$numberOfResultsColumns)*2, 4, $signup->ResultsPlacements->price, '', 0, 'R' );
                    endif;

                    /**
                     * End of row
                     */
                    $this->pdf->Ln();

                });
                $this->pdf->Ln();
            endif;
            $i++;
        endforeach;


    }

    public function resultsPrecision()
    {
        $weaponclasses = $this->Competition->Signups->groupBy('weaponclasses_id');
        $i=0;
        foreach($weaponclasses as $index => $weaponclass):

            if($weaponclass):
                if($this->filter->pagebreak || $i == 0) $this->pageHeader($index);
                $numberOfResultsColumns = count($this->Competition->Stations)+8;
                $numberOfResultsColumns = ($this->filter->std_medals) ? $numberOfResultsColumns + 1 : $numberOfResultsColumns;
                $numberOfResultsColumns = ($this->Competition->results_prices && $this->filter->prices) ? $numberOfResultsColumns + 2 : $numberOfResultsColumns;
                /**
                 * Heading columns
                 */
                $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY(), 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
                $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+1);

                $this->pdf->cell($this->cellsWidth[0], 6, _('Plats'), '', 0, 'R' );
                $this->pdf->cell($this->cellsWidth[1], 6, _('Namn'), '', 0, 'L' );
                $this->pdf->cell($this->cellsWidth[2], 6, _('Förening'), '', 0, 'L' );
                $this->pdf->cell($this->cellsWidth[3], 6, _('Vapengrupp'), '', 0, 'R' );

                for($i=1; $i<=count($this->Competition->Stations); $i++):
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, $i, '', 0, 'C' );
                endfor;
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 6, 'Tot', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, '8', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, '9', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, '10', '', 0, 'C' );

                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 6, 'Tot', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'SK', '', 0, 'R' );
                if($this->filter->std_medals):
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'M', '', 0, 'R' );
                endif;
                if($this->Competition->results_prices && $this->filter->prices):
                    $this->pdf->cell(($this->cellsWidth[4]/$numberOfResultsColumns)*2, 6, 'Pris', '', 0, 'R' );
                endif;
                $this->pdf->ln();

                $this->pdf->SetY($this->pdf->GetY()+4);

                $weaponclass->each(function($signup, $index) use ($numberOfResultsColumns){
                    $totals = [0,0,0];

                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    $this->pdf->SetX($this->leftMargin+2);
                    $this->pdf->cell($this->cellsWidth[0], 4, $signup->ResultsPlacements->placement, '', 0, 'R' );
                    $this->pdf->cell($this->cellsWidth[1], 4, $signup->User->fullName, '', 0, 'L' );
                    $this->pdf->cell($this->cellsWidth[2], 4, substr($signup->Club->name, 0, 33), '', 0, 'L' );
                    $this->pdf->cell($this->cellsWidth[3], 4, ($this->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname, '', 0, 'R' );

                    /**
                     * Results per station.
                     */
                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    $normal_points = 0;
                    for($i=1; $i<=count($this->Competition->Stations); $i++):
                        $points = $signup->Results->where('stations_id', $i)->pluck('points');
                        if(count($points)):
                        $normal_points+=$points[0];
                            $totals[0] += $points[0];
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $points[0], '', 0, 'C' );
                        else:
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, 0, '', 0, 'C' );
                        endif;
                    endfor;

                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 4, $normal_points, '', 0, 'C' );
                    /**
                     * Finals
                     */
                    $finals_points = Result::where('signups_id', $signup->id)->where('finals', 1)->where('stations_id', 1)->sum('points');
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $finals_points, '', 0, 'C' );
                    $finals_points = Result::where('signups_id', $signup->id)->where('finals', 1)->where('stations_id', 2)->sum('points');
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $finals_points, '', 0, 'C' );
                    $finals_points = Result::where('signups_id', $signup->id)->where('finals', 1)->where('stations_id', 3)->sum('points');
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $finals_points, '', 0, 'C' );

                   /**
                     * Totals
                     */
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 4, $signup->ResultsPlacements->points, '', 0, 'C' );

                    /**
                     * Distinguish
                     */
                    $distinguish_points = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('points');
                    $distinguish_points = ($distinguish_points) ? $distinguish_points : '';
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $distinguish_points, '', 0, 'C' );

                    /**
                     * Standard Medal
                     */
                    if($this->filter->std_medals):
                        $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $signup->ResultsPlacements->std_medal, '', 0, 'R' );
                    endif;

                    /**
                     * Price
                     */
                    if($this->Competition->results_prices && $this->filter->prices):
                        $this->pdf->cell(($this->cellsWidth[4]/$numberOfResultsColumns)*2, 4, $signup->ResultsPlacements->price, '', 0, 'R' );
                    endif;

                    /**
                     * End of row
                     */
                    $this->pdf->Ln();
                });
                $this->pdf->Ln();
            endif;
            $i++;
        endforeach;
    }

    public function resultsField()
    {
        $weaponclasses = $this->Competition->Signups->groupBy('weaponclasses_id');
        $i=0;
        foreach($weaponclasses as $index => $weaponclass):
            if($weaponclass):
                if($this->filter->pagebreak || $i == 0) $this->pageHeader($index);
                $numberOfResultsColumns = count($this->Competition->Stations)+4;
                $numberOfResultsColumns = ($this->filter->std_medals) ? $numberOfResultsColumns + 1 : $numberOfResultsColumns;
                $numberOfResultsColumns = ($this->Competition->results_prices && $this->filter->prices) ? $numberOfResultsColumns + 2 : $numberOfResultsColumns;
                /**
                 * Heading columns
                 */
                $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY(), 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
                $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+1);

                $this->pdf->cell($this->cellsWidth[0], 6, _('Plats'), '', 0, 'R' );
                $this->pdf->cell($this->cellsWidth[1], 6, _('Namn'), '', 0, 'L' );
                $this->pdf->cell($this->cellsWidth[2], 6, _('Förening'), '', 0, 'L' );
                $this->pdf->cell($this->cellsWidth[3], 6, _('Vapengrupp'), '', 0, 'R' );
                for($i=1; $i<=count($this->Competition->Stations); $i++):
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, $i, '', 0, 'C' );
                endfor;
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 6, 'Tot', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'P', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'SK', '', 0, 'C' );
                if($this->filter->std_medals):
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'M', '', 0, 'R' );
                endif;
                if($this->Competition->results_prices && $this->filter->prices):
                    $this->pdf->cell(($this->cellsWidth[4]/$numberOfResultsColumns)*2, 6, 'Pris', '', 0, 'R' );
                endif;
                $this->pdf->ln();

                $this->pdf->SetY($this->pdf->GetY()+4);

                $weaponclass->each(function($signup, $index) use ($numberOfResultsColumns){
                    $total_points = 0;
                    $total_hits = 0;
                    $total_figure_hits = 0;

                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    $this->pdf->SetX($this->leftMargin+2);
                    $this->pdf->cell($this->cellsWidth[0], 4, $signup->ResultsPlacements->placement, '', 0, 'R' );
                    $this->pdf->cell($this->cellsWidth[1], 4, $signup->User->fullName, '', 0, 'L' );
                    $this->pdf->cell($this->cellsWidth[2], 4, substr($signup->Club->name, 0, 33), '', 0, 'L' );
                    $this->pdf->cell($this->cellsWidth[3], 4, ($this->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname, '', 0, 'R' );

                    /**
                     * Results per station.
                     */
                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    for($i=1; $i<=count($this->Competition->Stations); $i++):
                        $result = $signup->Results->where('stations_id', $i)->first();
                        if($result):
                            $total_points += $result->points;
                            $total_figure_hits += $result->figure_hits;
                            $total_hits += $result->hits;
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $result->hits.'/'.$result->figure_hits, '', 0, 'C' );
                        else:
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4,'0/0', '', 0, 'C' );
                        endif;
                    endfor;

                    /**
                     * Totals
                     */
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 4, $total_hits.'/'.$total_figure_hits, '', 0, 'C' );
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $total_points, '', 0, 'C' );

                    /**
                     * Distinguish
                     */
                    $distinguish_hits = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('hits');
                    $distinguish_hits = ($distinguish_hits) ? $distinguish_hits : '';
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $distinguish_hits, '', 0, 'C' );

                    /**
                     * Standard Medal
                     */
                    if($this->filter->std_medals):
                        $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $signup->ResultsPlacements->std_medal, '', 0, 'R' );
                    endif;

                    /**
                     * Price
                     */
                    if($this->Competition->results_prices && $this->filter->prices):
                        $this->pdf->cell(($this->cellsWidth[4]/$numberOfResultsColumns)*2, 4, $signup->ResultsPlacements->price, '', 0, 'R' );
                    endif;

                    /**
                     * End of row
                     */
                    $this->pdf->Ln();

                });
                $this->pdf->Ln();
            endif;
            $i++;
        endforeach;

        $removedStations = Station::where('competitions_id', $this->Competition->id)->whereNotNull('removed')->orderBy('sortorder')->get();
        if(count($removedStations)):
            $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY()+3, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
            $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+4);

            $this->pdf->cell($this->cellsWidth[4], 6, _('Följande stationer blev strukna'), '', 1, 'L' );
            $this->pdf->SetY($this->pdf->GetY()+4);

            foreach($removedStations as $removedStation):
                $this->pdf->cell($this->cellsWidth[4], 4, _('Station').' '.$removedStation->sortorder.', '.$removedStation->removed, '', 1, 'L' );
            endforeach;
        endif;
    }
    public function resultsPointfield()
    {
        $weaponclasses = $this->Competition->Signups->groupBy('weaponclasses_id');
        $i=0;
        foreach($weaponclasses as $index => $weaponclass):
            if($weaponclass):
                if($this->filter->pagebreak || $i == 0) $this->pageHeader($index);
                $numberOfResultsColumns = count($this->Competition->Stations)+5;
                $numberOfResultsColumns = ($this->filter->std_medals) ? $numberOfResultsColumns + 1 : $numberOfResultsColumns;
                $numberOfResultsColumns = ($this->Competition->results_prices && $this->filter->prices) ? $numberOfResultsColumns + 2 : $numberOfResultsColumns;

                /**
                 * Heading columns
                 */
                $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY(), 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
                $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+1);

                $this->pdf->cell($this->cellsWidth[0], 6, _('Plats'), '', 0, 'R' );
                $this->pdf->cell($this->cellsWidth[1], 6, _('Namn'), '', 0, 'L' );
                $this->pdf->cell($this->cellsWidth[2], 6, _('Förening'), '', 0, 'L' );
                $this->pdf->cell($this->cellsWidth[3], 6, _('Vapengrupp'), '', 0, 'R' );
                for($i=1; $i<=count($this->Competition->Stations); $i++):
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, $i, '', 0, 'C' );
                endfor;
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 6, 'T/F', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'Tot', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'P', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'SK', '', 0, 'C' );
                if($this->filter->std_medals):
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'M', '', 0, 'R' );
                endif;
                if($this->Competition->results_prices && $this->filter->prices):
                    $this->pdf->cell(($this->cellsWidth[4]/$numberOfResultsColumns)*2, 6, 'Pris', '', 0, 'R' );
                endif;
                $this->pdf->ln();

                $this->pdf->SetY($this->pdf->GetY()+4);

                $weaponclass->each(function($signup, $index) use ($numberOfResultsColumns){
                    $total_points = 0;
                    $total_hits = 0;
                    $total_figure_hits = 0;

                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    $this->pdf->SetX($this->leftMargin+2);
                    $this->pdf->cell($this->cellsWidth[0], 4, $signup->ResultsPlacements->placement, '', 0, 'R' );
                    $this->pdf->cell($this->cellsWidth[1], 4, $signup->User->fullName, '', 0, 'L' );
                    $this->pdf->cell($this->cellsWidth[2], 4, substr($signup->Club->name, 0, 33), '', 0, 'L' );
                    $this->pdf->cell($this->cellsWidth[3], 4, ($this->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname, '', 0, 'R' );

                    /**
                     * Results per station.
                     */
                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    for($i=1; $i<=count($this->Competition->Stations); $i++):
                        $result = $signup->Results->where('stations_id', $i)->first();
                        if($result):
                            $total_points += $result->points;
                            $total_figure_hits += $result->figure_hits;
                            $total_hits += $result->hits;
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $result->hits.'/'.$result->figure_hits, '', 0, 'C' );
                        else:
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4,'0/0', '', 0, 'C' );
                        endif;
                    endfor;

                    /**
                     * Totals
                     */
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 4, $total_hits.'/'.$total_figure_hits, '', 0, 'C' );
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, ($total_hits+$total_figure_hits), '', 0, 'C' );
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $total_points, '', 0, 'C' );

                    /**
                     * Distinguish
                     */
                    $distinguish_hits = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('hits');
                    $distinguish_hits = ($distinguish_hits) ? $distinguish_hits : 0;
                    $distinguish_figure_hits = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('figure_hits');
                    $distinguish_figure_hits = ($distinguish_figure_hits) ? $distinguish_figure_hits : 0;
                    $distinguish_total = 0;
                    $distinguish_total += ($distinguish_hits) ? $distinguish_hits : 0;
                    $distinguish_total += ($distinguish_figure_hits) ? $distinguish_figure_hits : 0;
                    $distinguish_total = ($distinguish_total) ? $distinguish_figure_hits : '';
                    $this->pdf->cell(round($this->cellsWidth[4]/$numberOfResultsColumns), 4, $distinguish_total, '', 0, 'C' );

                    /**
                     * Standard Medal
                     */
                    if($this->filter->std_medals):
                        $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $signup->ResultsPlacements->std_medal, '', 0, 'R' );
                    endif;
                    /**
                     * Price
                     */
                    if($this->Competition->results_prices && $this->filter->prices):
                        $this->pdf->cell(($this->cellsWidth[4]/$numberOfResultsColumns)*2, 4, $signup->ResultsPlacements->price, '', 0, 'R' );
                    endif;

                    /**
                     * End of row
                     */
                    $this->pdf->Ln();
                });
                $this->pdf->Ln();
            endif;
            $i++;
        endforeach;

        $removedStations = Station::where('competitions_id', $this->Competition->id)->whereNotNull('removed')->orderBy('sortorder')->get();
        if(count($removedStations)):
            $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY()+3, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
            $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+4);

            $this->pdf->cell($this->cellsWidth[4], 6, _('Följande stationer blev strukna'), '', 1, 'L' );
            $this->pdf->SetY($this->pdf->GetY()+4);

            foreach($removedStations as $removedStation):
                $this->pdf->cell($this->cellsWidth[4], 4, _('Station').' '.$removedStation->sortorder.', '.$removedStation->removed, '', 1, 'L' );
            endforeach;
        endif;
    }

    public function resultsMagnum()
    {
        $weaponclasses = $this->Competition->Signups->groupBy('weaponclasses_id');
        $i=0;
        foreach($weaponclasses as $index => $weaponclass):
            if($weaponclass):
                if($this->filter->pagebreak || $i == 0) $this->pageHeader($index);
                $numberOfResultsColumns = count($this->Competition->Stations)+4;
                $numberOfResultsColumns = ($this->filter->std_medals) ? $numberOfResultsColumns + 1 : $numberOfResultsColumns;
                $numberOfResultsColumns = ($this->Competition->results_prices && $this->filter->prices) ? $numberOfResultsColumns + 2 : $numberOfResultsColumns;
                /**
                 * Heading columns
                 */
                $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY(), 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
                $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+1);

                $this->pdf->cell($this->cellsWidth[0], 6, _('Plats'), '', 0, 'R' );
                $this->pdf->cell($this->cellsWidth[1], 6, _('Namn'), '', 0, 'L' );
                $this->pdf->cell($this->cellsWidth[2], 6, _('Förening'), '', 0, 'L' );
                $this->pdf->cell($this->cellsWidth[3], 6, _('Vapengrupp'), '', 0, 'R' );
                for($i=1; $i<=count($this->Competition->Stations); $i++):
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, $i, '', 0, 'C' );
                endfor;
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 6, 'Tot', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'P', '', 0, 'C' );
                $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'SK', '', 0, 'C' );
                if($this->filter->std_medals):
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 6, 'M', '', 0, 'R' );
                endif;
                if($this->Competition->results_prices && $this->filter->prices):
                    $this->pdf->cell(($this->cellsWidth[4]/$numberOfResultsColumns)*2, 6, 'Pris', '', 0, 'R' );
                endif;
                $this->pdf->ln();

                $this->pdf->SetY($this->pdf->GetY()+4);

                $weaponclass->each(function($signup, $index) use ($numberOfResultsColumns){
                    $total_points = 0;
                    $total_hits = 0;
                    $total_figure_hits = 0;

                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    $this->pdf->SetX($this->leftMargin+2);
                    $this->pdf->cell($this->cellsWidth[0], 4, $signup->ResultsPlacements->placement, '', 0, 'R' );
                    $this->pdf->cell($this->cellsWidth[1], 4, $signup->User->fullName, '', 0, 'L' );
                    $this->pdf->cell($this->cellsWidth[2], 4, substr($signup->Club->name, 0, 33), '', 0, 'L' );
                    $this->pdf->cell($this->cellsWidth[3], 4, ($this->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname, '', 0, 'R' );

                    /**
                     * Results per station.
                     */
                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    for($i=1; $i<=count($this->Competition->Stations); $i++):
                        $result = $signup->Results->where('stations_id', $i)->first();
                        if($result):
                            $total_points += $result->points;
                            $total_figure_hits += $result->figure_hits;
                            $total_hits += $result->hits;
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $result->hits.'/'.$result->figure_hits, '', 0, 'C' );
                        else:
                            $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4,'0/0', '', 0, 'C' );
                        endif;
                    endfor;

                    /**
                     * Totals
                     */
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns+$this->cellsWidth[4]/$numberOfResultsColumns, 4, $total_hits.'/'.$total_figure_hits, '', 0, 'C' );
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $total_points, '', 0, 'C' );

                    /**
                     * Distinguish
                     */
                    $distinguish_hits = Result::where('signups_id', $signup->id)->where('distinguish', 1)->sum('hits');
                    $distinguish_hits = ($distinguish_hits) ? $distinguish_hits : '';
                    $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $distinguish_hits, '', 0, 'C' );

                    /**
                     * Standard Medal
                     */
                    if($this->filter->std_medals):
                        $this->pdf->cell($this->cellsWidth[4]/$numberOfResultsColumns, 4, $signup->ResultsPlacements->std_medal, '', 0, 'R' );
                    endif;

                    /**
                     * Price
                     */
                    if($this->Competition->results_prices && $this->filter->prices):
                        $this->pdf->cell(($this->cellsWidth[4]/$numberOfResultsColumns)*2, 4, $signup->ResultsPlacements->price, '', 0, 'R' );
                    endif;

                    /**
                     * End of row
                     */
                    $this->pdf->Ln();

                });
                $this->pdf->Ln();
            endif;
            $i++;
        endforeach;

        $removedStations = Station::where('competitions_id', $this->Competition->id)->whereNotNull('removed')->orderBy('sortorder')->get();
        if(count($removedStations)):
            $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY()+3, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
            $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+4);

            $this->pdf->cell($this->cellsWidth[4], 6, _('Följande stationer blev strukna'), '', 1, 'L' );
            $this->pdf->SetY($this->pdf->GetY()+4);

            foreach($removedStations as $removedStation):
                $this->pdf->cell($this->cellsWidth[4], 4, _('Station').' '.$removedStation->sortorder.', '.$removedStation->removed, '', 1, 'L' );
            endforeach;
        endif;
    }

   public function resultsComment()
    {
        $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY()+3, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
        $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+4);

        $this->pdf->cell($this->cellsWidth[4], 6, _('Kommentarer från arrangör'), '', 1, 'L' );
        $this->pdf->SetY($this->pdf->GetY()+4);
        $this->pdf->MultiCell(186, 4, $this->Competition->results_comment, 0, 'L', false, 1, '' ,'', false);
    }
    public function resultsSponsors()
    {
        $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY()+3, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
        $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+4);

        $this->pdf->cell($this->cellsWidth[4], 6, _('Tävlingens sponsorer'), '', 1, 'L' );
        $this->pdf->SetY($this->pdf->GetY()+4);
        foreach($this->Competition->Sponsors as $sponsor):
            $image = storage_path().'/app/competitions/'.$this->Competition->id.'/sponsors/'.$sponsor->image;
            $this->pdf->Image($image, $this->pdf->GetX()+40, $this->pdf->GetY(), 100, 0);
        endforeach;
    }
}