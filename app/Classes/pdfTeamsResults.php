<?php

namespace App\Classes;
use App\Models\Competition;

class CustomPdf extends BasePDF {

    public $weapongroups_id;
    public $Competition;

    //Page header
    public function Header() {
        $logotype = $this->Competition->pdf_logo_path;
        $logoDimensions = $this->getLogoDimensions($logotype);
        $this->Image($logotype, $this->GetX(), $this->GetY(), 0, 15);

        $this->SetFont('helvetica', '', 20);
        $this->RoundedRect(108, 10, 92, 18, 2, '1111', 'F',null, [240,240,240]);
        $this->SetX(110);
        $this->cell(88, 0, _('Lagresultat'), '', 0, 'L');
        $this->SetX(110);
        $this->cell(88, 0, $this->Competition->date, '', 0, 'R');

        $this->SetFont('helvetica', '', 11);
        $this->SetXY(110, $this->GetY()+10);
        $this->Competition->fullname = ($this->Competition->Championship) ? $this->Competition->Championship->name : $this->Competition->name;
        $this->cell(70, 0, $this->Competition->fullname, '', 0, 'L');
        $description = $this->Competition->Competitiontype->name;
        $description .= ': ';
        foreach($this->Competition->Weapongroups as $weapongroup):
            if($weapongroup->id == $this->weapongroups_id):
                $description .= $weapongroup->name.' ';
            endif;
        endforeach;
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

class pdfTeamsResults
{
    public function __construct() {
        $this->leftMargin = 10;
        $this->topMargin = 10;
        $this->footerMargin = 30;
        $this->fontSize = 15;
        $this->fontColor = '30';
        $this->borderRadius = 2;
        $this->fillColor = [240,240,240];
        $this->lineColor = [150,150,150];
        $this->lineWidth = 0.1;
        $this->color1 = '#ffffff';
        $this->color2 = '#f0f0f0';
        $this->signupCells = [40, 100, 46]; //186
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

    public function create($competitionsId, $patrolsOutput)
    {

        $this->pdf = new CustomPdf();
        $this->pdfSettings($this->pdf);

        $this->competitionsId = $competitionsId;
        $this->filter = new \stdClass();
        $this->filter->orderby = (isset($patrolsOutput['orderby'])) ? $patrolsOutput['orderby'] : 'clubs';
        $this->filter->pagebreak = (isset($patrolsOutput['pagebreak'])) ? $patrolsOutput['pagebreak'] : false;

        $this->destination = 'I';
        $this->Competition = Competition::with([
            'Teams',
            'Teams.Signups'=>function($query){
                $query->whereHas('ResultsPlacements', function($query){
                    $query->where('placement', '!=', 0);
                });
            },
            'Teams.Signups.ResultsPlacements',
            'Teams.Club',
            'Teams.Weapongroup',
            'Teams.Signups.User',
            'Competitiontype',
            'Weaponclasses',
            'Club',
            'Club.District'
        ])
            ->find($competitionsId);
        $this->Competition->Weapongroups = $this->Competition->weaponclasses->unique('weapongroups_id')->map(function($weaponclass, $key){
            return $weaponclass->weapongroup;
        });
        $this->pdf->Competition = $this->Competition;

        if($this->filter->orderby == 'teams'):
            $this->teams();
        elseif($this->filter->orderby == 'clubs'):
            $this->teamsByClub();
        endif;

        return $this->pdf->Output($this->Competition->name.' Teams.pdf','I');
    }

    public function pageHeader($weapongroups_id=null)
    {
        $this->pdf->weapongroups_id = $this->weapongroups_id;
        $this->pdf->startPageGroup();
        $this->pdf->AddPage();
    }

    public function teamsByClub()
    {
        if($this->Competition->Teams):

            $weapongroups = $this->Competition->Teams->groupBy('weapongroups_id');
            foreach($weapongroups as $weapongroups_id=>$weapongroup):
                foreach($weapongroup as $team):
                    $team->points = 0;
                    $team->hits = 0;
                    $team->figure_hits = 0;
                    $team->ranking = 0;
                    $i = 0;
                    foreach($team->Signups as $signup):
                        if($signup->ResultsPlacements):
                            if((in_array((int)$weapongroups_id, [4,5,6]) && $i==2) || ($i == 3)) continue;
                            if($this->Competition->results_type == 'precision'):
                                $team->points += $signup->Results()->where('finals', 0)->where('distinguish', 0)->sum('points');
                            elseif($this->Competition->results_type == 'military'):
                                $team->points += $signup->Results()->where('distinguish', 0)->sum('points');
                                $team->hits += $signup->Results()->where('distinguish', 0)->sum('hits');
                            elseif($this->Competition->results_type == 'field'):
                                $team->hits += $signup->Results()->where('distinguish', 0)->sum('hits');
                                $team->points += $signup->Results()->where('distinguish', 0)->sum('points');
                                $team->figure_hits += $signup->Results()->where('distinguish', 0)->sum('figure_hits');
                            elseif($this->Competition->results_type == 'pointfield'):
                                $team->hits += $signup->Results()->where('distinguish', 0)->sum('hits');
                                $team->points += $signup->Results()->where('distinguish', 0)->sum('points');
                                $team->figure_hits += $signup->Results()->where('distinguish', 0)->sum('figure_hits');
                            elseif($this->Competition->results_type == 'magnum'):
                                $team->hits += $signup->Results()->where('distinguish', 0)->sum('hits');
                                $team->points += $signup->Results()->where('distinguish', 0)->sum('points');
                                $team->figure_hits += $signup->Results()->where('distinguish', 0)->sum('figure_hits');
                            endif;
                        $i++;
                        endif;
                    endforeach;

                    if($this->Competition->results_type == 'military'):
                        $team->ranking .= str_pad($team->points, 4, 0, STR_PAD_LEFT);
                        $team->ranking .= str_pad($team->hits, 4, 0, STR_PAD_LEFT);
                    elseif($this->Competition->results_type == 'precision'):
                        $team->ranking .= str_pad($team->points, 4, 0, STR_PAD_LEFT);
                    elseif($this->Competition->results_type == 'field'):
                        $team->ranking .= str_pad($team->hits, 4, 0, STR_PAD_LEFT);
                        $team->ranking .= str_pad($team->figure_hits, 4, 0, STR_PAD_LEFT);
                        $team->ranking .= str_pad($team->points, 4, 0, STR_PAD_LEFT);
                    elseif($this->Competition->results_type == 'magnum'):
                        $team->ranking .= str_pad($team->hits, 4, 0, STR_PAD_LEFT);
                        $team->ranking .= str_pad($team->figure_hits, 4, 0, STR_PAD_LEFT);
                        $team->ranking .= str_pad($team->points, 4, 0, STR_PAD_LEFT);
                    elseif($this->Competition->results_type == 'pointfield'):
                        $team->ranking .= str_pad(($team->hits+$team->figure_hits), 4, 0, STR_PAD_LEFT);
                        $team->ranking .= str_pad($team->points, 4, 0, STR_PAD_LEFT);
                    endif;
                endforeach;
                $teams = $weapongroup->sortByDesc('ranking');
                $this->weapongroups_id = $weapongroups_id;
                $this->pageHeader();
                $team_placement = 1;
                foreach($teams as $team):
                    $team->placement = $team_placement;
                    $team_placement++;
                    $cp = $this->pdf->getPage();
                    $this->pdf->startTransaction();
                    $this->addTeam($team);
                    if($this->pdf->getPage() > $cp):
                        $this->pdf->rollbackTransaction(true);
                        $this->pageHeader();
                        $this->addTeam($team);
                    else:
                        $this->pdf->commitTransaction();
                    endif;
                endforeach;
            endforeach;
        endif;
    }

    public function addTeam($team)
    {
        if($team->points || $team->hits || $team->figure_hits):
            $this->pdf->SetFont('helvetica', '', $this->fontSize-2);
            $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY()+3, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
            $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+4);

            $this->pdf->cell((184/2), 6, $team->placement.' '.$team->Club->name, '', 0, 'L' );

            if($this->Competition->results_type == 'military'):
                $this->pdf->cell((184/2), 6, _('Tot').': '.$team->points.' ('.$team->hits.'x) '.' '.$team->WeaponGroup->name, '', 1, 'R' );
            elseif($this->Competition->results_type == 'precision'):
                $this->pdf->cell((184/2), 6, _('Tot').': '.$team->points.' '.$team->WeaponGroup->name, '', 1, 'R' );
            elseif($this->Competition->results_type == 'field'):
                $this->pdf->cell((184/2), 6, _('Tot').': '.$team->hits.'/'.$team->figure_hits.' ('.$team->points.'p) '.$team->WeaponGroup->name, '', 1, 'R' );
            elseif($this->Competition->results_type == 'pointfield'):
                $this->pdf->cell((184/2), 6, _('Tot').': '.($team->hits+$team->figure_hits).' ('.$team->points.'p) '.$team->WeaponGroup->name, '', 1, 'R' );
            elseif($this->Competition->results_type == 'magnum'):
                $this->pdf->cell((184/2), 6, _('Tot').': '.$team->hits.'/'.$team->figure_hits.' ('.$team->points.'p) '.$team->WeaponGroup->name, '', 1, 'R' );
            endif;

            $this->pdf->SetY($this->pdf->GetY()+4);
            $this->pdf->SetFont('helvetica', '', $this->fontSize-5);
            $i=0;

            /*
            if($this->Competition->results_type == 'military'):
                $signups = $team->Signups->sortByDesc(function($signup){
                    return ($signup->ResultsPlacements) ? $signup->ResultsPlacements->points : 0;
                });
            elseif($this->Competition->results_type == 'precision'):
                $signups = $team->Signups->sortByDesc(function($signup){
                    return ($signup->ResultsPlacements) ? $signup->ResultsPlacements->points : 0;
                });
            elseif($this->Competition->results_type == 'field'):
                $signups = $team->Signups->sortByDesc(function($signup){
                    return ($signup->ResultsPlacements) ? $signup->ResultsPlacements->hits : 0;
                });
            endif;
            */

            foreach($team->Signups as $signup):
                if($signup->ResultsPlacements):
                    if((in_array($team->weapongroups_id, [4,5,6]) && $i==2) || ($i == 3)) continue;
                    $this->pdf->SetX($this->leftMargin+2);
                    switch($signup->pivot->position):
                        case 1:
                            $this->pdf->cell($this->signupCells[0], 4, _('Första skytt'), '', 0, 'L' );
                            break;
                        case 2:
                            $this->pdf->cell($this->signupCells[0], 4, _('Andra skytt'), '', 0, 'L' );
                            break;
                        case 3:
                            $this->pdf->cell($this->signupCells[0], 4, _('Tredje skytt'), '', 0, 'L' );
                            break;
                        case 4:
                            $this->pdf->cell($this->signupCells[0], 4, _('Första reserv'), '', 0, 'L' );
                            break;
                        case 5:
                            $this->pdf->cell($this->signupCells[0], 4, _('Andra reserv'), '', 0, 'L' );
                            break;
                    endswitch;
                    $this->pdf->cell($this->signupCells[1], 4, $signup->User->fullname, '', 0, 'L' );

                    if($this->Competition->results_type == 'military'):
                        $this->pdf->cell($this->signupCells[2], 4, $signup->ResultsPlacements->points, '', 1, 'R' );
                    elseif($this->Competition->results_type == 'precision'):
                        $points = $signup->Results()->where('distinguish', 0)->where('finals', 0)->sum('points');
                        $this->pdf->cell($this->signupCells[2], 4, $points, '', 1, 'R' );
                    elseif($this->Competition->results_type == 'field'):
                        $this->pdf->cell($this->signupCells[2], 4, $signup->ResultsPlacements->hits.'/'.$signup->ResultsPlacements->figure_hits, '', 1, 'R' );
                    elseif($this->Competition->results_type == 'pointfield'):
                        $this->pdf->cell($this->signupCells[2], 4, ($signup->ResultsPlacements->hits+$signup->ResultsPlacements->figure_hits), '', 1, 'R' );
                    elseif($this->Competition->results_type == 'magnum'):
                        $this->pdf->cell($this->signupCells[2], 4, $signup->ResultsPlacements->hits.'/'.$signup->ResultsPlacements->figure_hits, '', 1, 'R' );
                    endif;


                    $i++;
                endif;
            endforeach;
        endif;
    }

}