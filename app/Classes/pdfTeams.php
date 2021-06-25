<?php

namespace App\Classes;
use App\Models\Competition;

class pdfTeams extends BasePDF
{
    public function __construct() {
        $this->leftMargin = 10;
        $this->topMargin = 20;
        $this->footerMargin = 30;
        $this->fontSize = 15;
        $this->fontColor = '30';
        $this->borderRadius = 2;
        $this->fillColor = [240,240,240];
        $this->lineColor = [150,150,150];
        $this->lineWidth = 0.1;
        $this->color1 = '#ffffff';
        $this->color2 = '#f0f0f0';
        $this->signupCells = [40, 146]; //186
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

    public function create($competitionsId, $patrolsOutput)
    {

        $this->pdf = new \TCPDF();
        $this->pdfSettings($this->pdf);

        $this->competitionsId = $competitionsId;
        $this->filter = new \stdClass();
        $this->filter->orderby = (isset($patrolsOutput['orderby'])) ? $patrolsOutput['orderby'] : 'clubs';
        $this->filter->pagebreak = (isset($patrolsOutput['pagebreak'])) ? $patrolsOutput['pagebreak'] : false;

        $this->destination = 'I';
        $this->Competition = Competition::with([
            'Teams',
            'Teams.Signups',
            'Teams.Club',
            'Teams.Weapongroup',
            'Teams.Signups.User',
            'Competitiontype',
            'Weaponclasses',
            'Club',
            'Club.District'
        ])
        ->find($competitionsId);

        if($this->filter->orderby == 'teams'):
            $this->teams();
        elseif($this->filter->orderby == 'clubs'):
            $this->teamsByClub();
        endif;

        return $this->pdf->Output($this->Competition->name.' Teams.pdf','I');
    }

    public function pageHeader()
    {
        $this->pdf->AddPage();

        $this->pdf->SetFont('helvetica', '', $this->fontSize+10);

        $logotype = $this->Competition->pdf_logo_path;
        $logoDimensions = $this->getLogoDimensions($logotype);
        $this->pdf->Image($logotype, $this->pdf->GetX(), $this->pdf->GetY(), 0, 15);

        $this->pdf->SetFont('helvetica', '', $this->fontSize+5);
        $this->pdf->RoundedRect(210-$this->leftMargin-92, 10, 92, 18, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
        $this->pdf->writeHTMLCell(0, 0, 110, 11, _('Laglista'));

        $this->pdf->writeHTMLCell(70, 0, 210-$this->leftMargin-72, 11, $this->Competition->date, 0, 0, false, true, 'R');

        $this->pdf->SetFont('helvetica', '', $this->fontSize-5);
        $this->pdf->SetXY(110, $this->pdf->GetY()+10);
        $this->Competition->fullname = ($this->Competition->Championship) ? $this->Competition->Championship->name : $this->Competition->name;
        $this->Competition->fullname .= ' | ';
        $this->Competition->fullname .= $this->Competition->Competitiontype->name;
        $this->Competition->fullname .= ' | ';
        foreach($this->Competition->Weaponclasses as $weaponclass):
            $this->Competition->fullname .= ($this->Competition->championships_id) ? $weaponclass->classname_general : $weaponclass->classname.' ';
        endforeach;
        $this->pdf->cell(0, 0, $this->Competition->fullname);
        $this->pdf->SetXY(0, 29);

        $this->pageFooter();
    }

    public function teamsByClub()
    {
        if($this->Competition->Teams):

            $clubs = $this->Competition->Teams->groupBy('clubs_id');
            $this->pageHeader();
            foreach($clubs as $club):
                foreach($club as $team):
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
        $this->pdf->SetFont('helvetica', '', $this->fontSize-5);
        $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY()+3, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
        $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+4);

        $this->pdf->cell($this->signupCells[0], 6, $team->Club->name, '', 0, 'L' );
        $this->pdf->cell($this->signupCells[1], 6, $team->WeaponGroup->name, '', 1, 'R' );

        $this->pdf->SetY($this->pdf->GetY()+4);
        $this->pdf->SetFont('helvetica', '', $this->fontSize)-2;
        $team->Signups->each(function($signup){
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
            $this->pdf->cell($this->signupCells[1], 4, $signup->User->fullname, '', 1, 'L' );
        });
    }

    public function pageFooter() { 
        $this->addFooterLogotype($this->pdf);
    }

}