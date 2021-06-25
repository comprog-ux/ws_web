<?php

namespace App\Classes;
use App\Models\Competition;
use App\Models\Patrol;
use App\Models\PatrolDistinguish;
use App\Models\PatrolFinals;
use App\Models\Station;
use App\Models\Signup;

class pdfShootingcards extends BasePDF
{
    public function __construct() {
        $this->leftMargin = 15;
        $this->topMargin = 20;
        $this->footerMargin = 30;
        $this->fontSize = 12;
        $this->fontColor = '30';
        $this->borderRadius = 2;
        $this->fillColor = [240,240,240];
        $this->lineColor = [150,150,150];
        $this->lineWidth = 0.1;
        $this->color1 = '#ffffff';
        $this->color2 = '#f0f0f0';
        $this->signupCells = [30, 146]; //176
        $this->inputboxWidth = 9;
        $this->inputboxHeight = 8;
        $this->inputboxBorderStyle = ['width'=>0.5, 'color'=>[50,50,50]];
        $this->inputboxBorderStyleDark = ['width'=>0.5, 'color'=>[30,30,30]];
        $this->inputboxLeftMargin = 3;
    }

    /**
     * Init the pdf
     */
    private function pdfSettings($pdf)
    {
        $pdf->SetPrintHeader(false);
        $pdf->SetPrintFooter(false);
        $pdf->SetHeaderMargin($this->topMargin);
        $pdf->setFooterMargin($this->footerMargin);
        $pdf->setLeftMargin($this->leftMargin);
        $pdf->setRightMargin($this->leftMargin);
        $pdf->SetAutoPageBreak(true, PDF_MARGIN_FOOTER);
        $pdf->SetAuthor('Author');
        $pdf->SetDisplayMode('real', 'default');
        $pdf->SetFont('helvetica', '', $this->fontSize);
        $pdf->SetTextColor($this->fontColor);
    }

    public function create($competitionsId, $request)
    {

        $this->pdf = new \TCPDF();
        $this->pdfSettings($this->pdf);

        $this->competitionsId = $competitionsId;
        $this->Competition = Competition::find($competitionsId);

        $this->filter = new \stdClass();
        $this->filter->patrol_type = (isset($request['patrol_type'])) ? $request['patrol_type'] : '';
        $this->filter->lane_start = (isset($request['lane_start']) && $request['lane_start'] > 0) ? (int)$request['lane_start'] : 1;
        $this->filter->lane_end = (isset($request['lane_end']) && $request['lane_end'] > 0) ? (int)$request['lane_end'] : $this->Competition->patrol_size;
        $this->filter->patrol = (isset($request['patrol'])) ? (int)$request['patrol'] : '';

        $this->destination = 'I';
        $this->Competition->load([
            'Signups'=>function($query){
                $query->join('clubs as signup_club', 'signup_club.id', '=', 'competitions_signups.clubs_id');
                $query->join('patrols as signup_patrol', 'signup_patrol.id', '=', 'competitions_signups.patrols_id');
                $query->select('competitions_signups.*', 'signup_club.*', 'signup_club.name as club_name');
                $query->orderBy('signup_patrol.sortorder');
                $query->orderBy('competitions_signups.lane');

                if($this->filter->patrol_type == 'distinguish'):
                    if($this->filter->lane_start):
                        $query->where('lane_distinguish', '>=', $this->filter->lane_start);
                    endif;
                    if($this->filter->lane_end):
                        $query->where('lane_distinguish', '<=', $this->filter->lane_end);
                    endif;
                elseif($this->filter->patrol_type == 'finals'):
                    if($this->filter->lane_start):
                        $query->where('lane_finals', '>=', $this->filter->lane_start);
                    endif;
                    if($this->filter->lane_end):
                        $query->where('lane_finals', '<=', $this->filter->lane_end);
                    endif;
                else:
                    if($this->filter->lane_start):
                        $query->where('lane', '>=', $this->filter->lane_start);
                    endif;
                    if($this->filter->lane_end):
                        $query->where('lane', '<=', $this->filter->lane_end);
                    endif;
                endif;
            },
            'Signups.Club',
            'Signups.User',
            'Signups.Weaponclass',
            'Signups.Patrol',
            'Competitiontype',
            'Weaponclasses',
            'Club',
            'Club.District'
        ]);

        /**
         * Fetch the patrols depending on which type of patrols is requested.
         */
        if($this->filter->patrol_type == 'distinguish'):
            $this->Competition->Stations = [
                new Station(['sortorder'=>1, 'figures'=>6,'points'=>1]),
                new Station(['sortorder'=>2, 'figures'=>6,'points'=>1]),
                new Station(['sortorder'=>3, 'figures'=>6,'points'=>1]),
                new Station(['sortorder'=>4, 'figures'=>6,'points'=>1]),
                new Station(['sortorder'=>5, 'figures'=>6,'points'=>1]),
                new Station(['sortorder'=>6, 'figures'=>6,'points'=>1])
            ];
            $query = PatrolDistinguish::where('competitions_id', $this->Competition->id);
        elseif($this->filter->patrol_type == 'finals'):
            $this->Competition->Stations = Station::where('competitions_id', $this->Competition->id)->orderBy('sortorder')->get();
            $query = PatrolFinals::where('competitions_id', $this->Competition->id);
        else:
            $this->Competition->Stations = Station::where('competitions_id', $this->Competition->id)->orderBy('sortorder')->get();
            $query = Patrol::where('competitions_id', $this->Competition->id);
        endif;
        if($this->filter->patrol) $query->where('sortorder', '=', $this->filter->patrol);



        $query->with([
            'Signups'=>function($query){
                if($this->filter->patrol_type == 'distinguish'):
                    if($this->filter->lane_start):
                        $query->where('lane_distinguish', '>=', $this->filter->lane_start);
                    endif;
                    if($this->filter->lane_end):
                        $query->where('lane_distinguish', '<=', $this->filter->lane_end);
                    endif;
                    $query->orderBy('lane_distinguish');
                elseif($this->filter->patrol_type == 'finals'):
                    if($this->filter->lane_start):
                        $query->where('lane_finals', '>=', $this->filter->lane_start);
                    endif;
                    if($this->filter->lane_end):
                        $query->where('lane_finals', '<=', $this->filter->lane_end);
                    endif;
                    $query->orderBy('lane_finals');
                else:
                    if($this->filter->lane_start):
                        $query->where('lane', '>=', $this->filter->lane_start);
                    endif;
                    if($this->filter->lane_end):
                        $query->where('lane', '<=', $this->filter->lane_end);
                    endif;
                    $query->orderBy('lane');
                endif;
            },
            'Signups.Club',
            'Signups.Weaponclass',
            'Signups.User',
        ]);
        $query->orderBy('sortorder');
        $patrols = $query->get();
        $this->Competition->Patrols = $patrols;

        if(count($this->Competition->Patrols)):
            if($this->Competition->results_type == 'military'):
                $this->shootingCardMilitary();
            elseif($this->Competition->results_type == 'precision'):
                $this->shootingCardPrecision();
            elseif($this->Competition->results_type == 'field' || 'pointfield' || 'magnum'):
                $this->shootingCardField();
            endif;

            return $this->pdf->Output($this->Competition->name.' Patrols.pdf','I');
        endif;
    }

    public function pageFooter()
    {
        $this->addFooterLogotype($this->pdf);
    }

    function __call($name, $arguments)
    {
        // TODO: Implement __call() method.
    }

    public function pageHeader($patrol, $series=null)
    {
        $this->pdf->AddPage();

        $this->pdf->SetFont('helvetica', '', $this->fontSize+10);
        $logotype = $this->Competition->pdf_logo_path;
        $logoDimensions = $this->getLogoDimensions($logotype);
        
        $this->pdf->Image($logotype, $this->pdf->GetX(), $this->pdf->GetY(), 0, 15);

        $this->pdf->SetFont('helvetica', '', $this->fontSize+10);
        $this->pdf->RoundedRect(210-$this->leftMargin-87, 10, 92, 24, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
        $this->pdf->writeHTMLCell(0, 0, 110, 11, _('Skjutkort'));

        $this->pdf->writeHTMLCell(70, 0, 210-$this->leftMargin-72, 11, $this->Competition->date, 0, 0, false, true, 'R');

        $this->pdf->SetFont('helvetica', '', $this->fontSize);
        $this->pdf->SetXY(110, $this->pdf->GetY()+10);
        $this->Competition->fullname = $this->Competition->name;
        $this->Competition->fullname .= ' | ';
        $this->Competition->fullname .= $this->Competition->Competitiontype->name;
        $this->Competition->fullname .= ' | ';
        foreach($this->Competition->Weaponclasses as $weaponclass):
            $this->Competition->fullname .= ($this->Competition->championships_id) ? $weaponclass->classname_general : $weaponclass->classname.' ';
        endforeach;
        $this->pdf->cell(80, 4, $this->Competition->fullname);

        $this->pdf->SetXY(110, $this->pdf->GetY()+6);
        $this->pdf->cell(44, 4, ucfirst($this->Competition->translations->patrols_name_singular).' '.$patrol->sortorder.' ('.$patrol->start_time_human.')');
        if($series) $this->pdf->cell(44, 4, _('Serie').': '.$series, '', 0, 'R');
        $this->pdf->SetXY($this->leftMargin, 40);

        $this->pageFooter();
    }

    public function shootingCardMilitary()
    {
        if($this->Competition->Patrols):

            /**
             * Loop the card three times which creates 12 series.
             * Add 4 on each loop which creates 1,5 and 9 as starter serie.
             * Each card in the loop contains 4 series each.
             */
            $this->Competition->Patrols->each(function($patrol, $index) {
                for($serie=1;$serie<=12;$serie+=4):
                    $series = $serie.'-'.($serie+3);
                    $this->pageHeader($patrol, $series);
                    $lane = $this->filter->lane_start;
                    for($lane;$lane<=$this->filter->lane_end; $lane++):

                        if($this->filter->patrol_type == 'finals'):
                            $signup = $patrol->Signups->where('lane_finals', $lane)->first();
                        elseif($this->filter->patrol_type == 'distinguish'):
                            $signup = $patrol->Signups->where('lane_finals', $lane)->first();
                        else:
                            $signup = $patrol->Signups->where('lane', $lane)->first();
                        endif;
                        if(!$signup):
                            $signup = new Signup();
                            $signup->lane = $lane;
                        endif;
                        $cp = $this->pdf->getPage();
                        $this->pdf->startTransaction();
                        $this->resultsMilitary($signup, $serie);
                        if($this->pdf->getPage() > $cp):
                            $this->pdf->rollbackTransaction(true);
                            $this->pageHeader($patrol, $series);
                            $this->resultsMilitary($signup, $serie);
                        else:
                            $this->pdf->commitTransaction();
                        endif;
                    endfor;
                endfor;
            });
        endif;
    }

    private function resultsMilitary($signup, $serie)
    {
        $this->pdf->SetFont('helvetica', '', $this->fontSize+1);
        $this->pdf->cell($this->signupCells[0], 4, ucfirst($this->Competition->translations->patrols_lane_singular).' '.$signup->lane, '', 0, 'L' );
        if($signup->User):
            $this->pdf->cell($this->signupCells[1], 4, $signup->User->fullName.', '.$signup->Club->name.', '.(($this->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname), '', 0, 'L' );
        endif;
        $this->pdf->Ln();
        $this->pdf->SetFont('helvetica', '', $this->fontSize-4);
        $serieMax = $serie+2;
        for($serie; $serie<$serieMax;$serie+=1):
            $this->pdf->SetY($this->pdf->GetY()+1);
            $this->pdf->cell(($this->inputboxWidth*5)+$this->inputboxLeftMargin+6, 4, _('Serie'), '', 0);
            $this->pdf->cell(($this->inputboxWidth)+$this->inputboxLeftMargin, 4, _('Resultat'), '', 0);
            $this->pdf->cell(($this->inputboxWidth)+$this->inputboxLeftMargin, 4, _('Innertior'), '', 0);
            $this->pdf->cell(($this->inputboxWidth)+$this->inputboxLeftMargin, 4, _('Vapenfel'), '', 0);

            $this->pdf->SetX(210-$this->leftMargin-($this->inputboxWidth*8)-($this->inputboxLeftMargin*3)-8);
            $this->pdf->cell(($this->inputboxWidth*5)+$this->inputboxLeftMargin+6, 4, _('Serie'), '', 0);
            $this->pdf->cell(($this->inputboxWidth)+$this->inputboxLeftMargin, 4, _('Resultat'), '', 0);
            $this->pdf->cell(($this->inputboxWidth)+$this->inputboxLeftMargin, 4, _('Innertior'), '', 0);
            $this->pdf->cell(($this->inputboxWidth)+$this->inputboxLeftMargin, 4, _('Vapenfel'), '', 0);
            $this->pdf->Ln(4);

            $this->pdf->SetX($this->pdf->GetX()+1);
            $this->pdf->SetFont('helvetica', '', $this->fontSize+1);
            $this->pdf->cell(6, $this->inputboxHeight, ($serie), '', 0);
            $this->pdf->SetFont('helvetica', '', $this->fontSize-4);
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->SetX($this->pdf->GetX()+$this->inputboxLeftMargin);
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->SetX($this->pdf->GetX()+$this->inputboxLeftMargin);
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->SetX($this->pdf->GetX()+$this->inputboxLeftMargin);
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');

            $this->pdf->SetX(210-$this->leftMargin-($this->inputboxWidth*8)-($this->inputboxLeftMargin*3)-7);
            $this->pdf->SetFont('helvetica', '', $this->fontSize+1);
            $this->pdf->cell(6, $this->inputboxHeight, ($serie+2), '', 0);
            $this->pdf->SetFont('helvetica', '', $this->fontSize-4);
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->SetX($this->pdf->GetX()+$this->inputboxLeftMargin);
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->SetX($this->pdf->GetX()+$this->inputboxLeftMargin);
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->SetX($this->pdf->GetX()+$this->inputboxLeftMargin);
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
            $this->pdf->Ln();
        endfor;

        $this->pdf->Ln(1);
        #$this->pdf->line($this->leftMargin, $this->pdf->GetY(), 210-$this->leftMargin, $this->pdf->GetY(), ['width'=>$this->lineWidth,'color'=>$this->lineColor]);
        $this->pdf->Ln(1);
    }

    public function shootingCardPrecision()
    {
        if($this->Competition->Patrols):
            /**
             * Loop the cards as many times there are stations.
             */
            $this->Competition->Patrols->each(function($patrol, $index) {
                $numberOfSeries = ($this->filter->patrol_type == 'finals') ? 3 : count($this->Competition->Stations);

                for($serie=1;$serie<=$numberOfSeries;$serie++):
                    $this->pageHeader($patrol, $serie);
                    for($lane=$this->filter->lane_start;$lane<=$this->filter->lane_end; $lane++):
                        if($this->filter->patrol_type == 'finals'):
                            $signup = $patrol->Signups->where('lane_finals', $lane)->first();
                        elseif($this->filter->patrol_type == 'distinguish'):
                            $signup = $patrol->Signups->where('lane_finals', $lane)->first();
                        else:
                            $signup = $patrol->Signups->where('lane', $lane)->first();
                        endif;
                        if(!$signup):
                            $signup = new Signup();
                            $signup->lane = $lane;
                        endif;
                        $cp = $this->pdf->getPage();
                        $this->pdf->startTransaction();
                        $this->resultsPrecision($signup, $serie);
                        if($this->pdf->getPage() > $cp):
                            $this->pdf->rollbackTransaction(true);
                            $this->pageHeader($patrol, $serie);
                            $this->resultsPrecision($signup, $serie);
                        else:
                            $this->pdf->commitTransaction();
                        endif;
                    endfor;
                endfor;
            });
        endif;
    }

    private function resultsPrecision($signup, $serie)
    {
        $this->pdf->SetFont('helvetica', '', $this->fontSize+1);
        if($this->filter->patrol_type == 'finals'):
            $this->pdf->cell($this->signupCells[0], 4, ucfirst($this->Competition->translations->patrols_lane_singular).' '.$signup->lane_finals, '', 0, 'L' );
        elseif($this->filter->patrol_type == 'distinguish'):
            $this->pdf->cell($this->signupCells[0], 4, ucfirst($this->Competition->translations->patrols_lane_singular).' '.$signup->lane_distinguish, '', 0, 'L' );
        else:
            $this->pdf->cell($this->signupCells[0], 4, ucfirst($this->Competition->translations->patrols_lane_singular).' '.$signup->lane, '', 0, 'L' );
        endif;
        if($signup->User):
            $this->pdf->cell($this->signupCells[1], 4, $signup->User->fullName.', '.$signup->Club->name.', '.(($this->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname), '', 0, 'L' );
        endif;
        $this->pdf->Ln();
        $this->pdf->SetY($this->pdf->GetY()+1);

        $this->pdf->SetFont('helvetica', '', $this->fontSize-4);
        $this->pdf->cell(($this->inputboxWidth*5)+$this->inputboxLeftMargin, 4, _('Poäng'), '', 0);
        #$this->pdf->cell(($this->inputboxWidth)+$this->inputboxLeftMargin, 4, _('Vapenfel'), '', 0);
        $this->pdf->cell(($this->inputboxWidth)+$this->inputboxLeftMargin, 4, _('Resultat'), '', 0);
        #$this->pdf->cell(($this->inputboxWidth)+$this->inputboxLeftMargin, 4, _('Innertior'), '', 0);
        $this->pdf->Ln(5);
        $this->pdf->SetX($this->pdf->GetX()+1);
        $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
        $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
        $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
        $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTB'=>$this->inputboxBorderStyle], 0, 'L');
        $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
        #$this->pdf->SetX($this->pdf->GetX()+$this->inputboxLeftMargin);
        #$this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
        #$this->pdf->SetX($this->pdf->GetX()+$this->inputboxLeftMargin);
        #$this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
        $this->pdf->SetX($this->pdf->GetX()+$this->inputboxLeftMargin);
        $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
        $this->pdf->Ln($this->inputboxHeight+2);
        #$this->pdf->line($this->leftMargin, $this->pdf->GetY(), 210-$this->leftMargin, $this->pdf->GetY(), ['width'=>$this->lineWidth,'color'=>$this->lineColor]);
        $this->pdf->Ln(2);
    }

    public function shootingCardField()
    {
        if($this->Competition->Patrols):
            $this->Competition->Patrols->each(function($patrol, $index){
                $this->pageHeader($patrol);
                for($lane=$this->filter->lane_start;$lane<=$this->filter->lane_end; $lane++):
                    if($this->filter->patrol_type == 'finals'):
                        $signup = $patrol->Signups->where('lane_finals', $lane)->first();
                    elseif($this->filter->patrol_type == 'distinguish'):
                        $signup = $patrol->Signups->where('lane_finals', $lane)->first();
                    else:
                        $signup = $patrol->Signups->where('lane', $lane)->first();
                    endif;
                    if(!$signup):
                        $signup = new Signup();
                        $signup->lane = $lane;
                    endif;
                    $cp = $this->pdf->getPage();
                    $this->pdf->startTransaction();
                    $this->resultsField($signup);
                    if($this->pdf->getPage() > $cp):
                        $this->pdf->rollbackTransaction(true);
                        $this->pageHeader($patrol);
                        $this->resultsField($signup);
                    else:
                        $this->pdf->commitTransaction();
                    endif;
                endfor;
            });
        endif;
    }

    private function resultsField($signup)
    {
        $this->pdf->SetFont('helvetica', '', $this->fontSize+1);
            $this->pdf->cell($this->signupCells[0], 4, ucfirst($this->Competition->translations->patrols_lane_singular).' '.$signup->lane, '', 0, 'L' );
        if($signup->User):
            $this->pdf->cell($this->signupCells[1], 4, $signup->User->fullName.', '.$signup->Club->name.', '.(($this->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname), '', 0, 'L' );
        endif;
        $this->pdf->Ln();
        $this->pdf->SetY($this->pdf->GetY()+2);

        $this->pdf->SetFont('helvetica', '', $this->fontSize-4);
        /**
         * Stations
         */
        $startX = $this->pdf->GetX()+$this->signupCells[0];
        $startY = $this->pdf->GetY();
        $posY = $startY;
        $highestY = $posY;
        $highestX = $startX;

        $this->pdf->cell($this->signupCells[0], 4, _('Stationer'), '', 0, 'L');

        foreach($this->Competition->Stations as $station):
            $startY = $posY;
            $this->pdf->SetXY($startX, $startY);
            $this->pdf->cell($this->inputboxWidth, 4, $station->sortorder, '', 0, 'C');
            $startY = $startY+5;
            for($i=1; $i<=$station->figures; $i++):
                $this->pdf->SetXY($startX, $startY);
                $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
                $startY = $startY + $this->inputboxHeight;
            endfor;
            $startX = $startX + $this->inputboxWidth + 2;
            $highestY = ($highestY < $startY) ? $startY : $highestY;
            $highestX = ($highestX < $startX) ? $startX : $highestX;
        endforeach;

        $this->pdf->SetXY($startX, $posY);
        $this->pdf->cell($this->inputboxWidth, 4, 'Tot', '', 0, 'C');
        $highestX = ($highestX < $startX) ? $startX : $highestX;

        /**
         * Points input
         */
        $startX = $this->leftMargin;
        $startY = $highestY+1;

        $this->pdf->SetXY($startX, $startY);
        $this->pdf->cell($this->signupCells[0], 4, _('Poäng'), '', 0, 'L');

        $startX = $this->leftMargin+$this->signupCells[0];
        $startY = $highestY+1;

        foreach($this->Competition->Stations as $station):
            $this->pdf->SetXY($startX, $startY);
            if($station->points):
                $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
            endif;
            $startX = $startX + $this->inputboxWidth + 2;
            $highestY = ($highestY < $this->pdf->GetY()) ? $this->pdf->GetY() : $highestY;
            $highestX = ($highestX < $startX) ? $startX : $highestX;
        endforeach;

        $this->pdf->SetXY($startX, $startY);
        $this->pdf->cell($this->inputboxWidth+10, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyleDark], 1, 'L');
        $startX = $startX + $this->inputboxWidth + 2;
        $highestY = ($highestY < $this->pdf->GetY()) ? $this->pdf->GetY() : $highestY;
        $highestX = ($highestX < $startX) ? $startX : $highestX;

        /**
         * Totals
         */
        $startX = $this->leftMargin;
        $startY = $highestY+1;

        $this->pdf->SetXY($startX, $startY);
        $this->pdf->cell($this->signupCells[0], 4, _('Resultat'), '', 0, 'L');

        $startX = $this->leftMargin+$this->signupCells[0];
        $startY = $highestY+1;

        foreach($this->Competition->Stations as $station):
            $this->pdf->SetXY($startX, $startY);
            $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');
            $startX = $startX + $this->inputboxWidth + 2;
            $highestY = ($highestY < $this->pdf->GetY()) ? $this->pdf->GetY() : $highestY;
            $highestX = ($highestX < $startX) ? $startX : $highestX;
        endforeach;

        $this->pdf->SetXY($startX, $startY);
        $this->pdf->cell($this->inputboxWidth+10, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyleDark], 0, 'L');
        $startX = $startX + $this->inputboxWidth + 2;
        $highestY = ($highestY < $this->pdf->GetY()) ? $this->pdf->GetY() : $highestY;
        $highestX = ($highestX < $startX) ? $startX : $highestX;

        /**
         * Notes
         */
        $this->pdf->SetXY(210-$this->leftMargin-40, $posY);
        $this->pdf->cell(40, 4, _('Omskjutning Stn'), '', 0, 'R');
        $this->pdf->SetXY(210-$this->leftMargin-$this->inputboxWidth, $this->pdf->GetY()+6);
        $this->pdf->cell($this->inputboxWidth, $this->inputboxHeight, '', ['LTBR'=>$this->inputboxBorderStyle], 0, 'L');

        $this->pdf->SetXY(210-$this->leftMargin-40, $this->pdf->GetY()+$this->inputboxHeight+3);
        $this->pdf->cell(40, 4, _('Anmärkning'), '', 0, 'R');
        $this->pdf->SetXY(210-$this->leftMargin-50, $this->pdf->GetY()+13);
        $noteLinewidth = ($highestX > 136) ? 186-$highestX-10 : 50;
        #$this->pdf->line(210-$this->leftMargin-$noteLinewidth, $this->pdf->GetY(), 210-$this->leftMargin, $this->pdf->GetY(), ['width'=>$this->lineWidth,'color'=>$this->lineColor]);
        $highestY = ($highestY < $this->pdf->GetY()) ? $this->pdf->GetY() : $highestY;

        /**
         * Seperation linte
         */
        $this->pdf->SetXY($this->leftMargin, $highestY);
        $this->pdf->Ln($this->inputboxHeight+2);
        $this->pdf->line($this->leftMargin, $this->pdf->GetY(), 210-$this->leftMargin, $this->pdf->GetY(), ['width'=>$this->lineWidth,'color'=>$this->lineColor]);
        $this->pdf->Ln(2);
    }


}