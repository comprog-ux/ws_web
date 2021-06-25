<?php

namespace App\Classes;
use App\Models\Competition;

class pdfPatrols extends BasePDF
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
        $this->signupCells = [24, 19, 58, 70, 15]; //186
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
        $this->filter->orderby = (isset($patrolsOutput['orderby'])) ? $patrolsOutput['orderby'] : 'patrols';
        $this->filter->pagebreak = (isset($patrolsOutput['pagebreak'])) ? $patrolsOutput['pagebreak'] : false;

        $this->destination = 'I';
        $this->Competition = Competition::with([
            'Patrols',
            'Patrols.Signups'=>function($query){
                $query->orderBy('lane');
            },
            'Patrols.Signups.Club',
            'Patrols.Signups.Weaponclass',
            'Patrols.Signups.User',
            'Signups'=>function($query){
                $query->join('clubs as signup_club', 'signup_club.id', '=', 'competitions_signups.clubs_id');
                $query->join('patrols as signup_patrol', 'signup_patrol.id', '=', 'competitions_signups.patrols_id');
                $query->select('competitions_signups.*', 'signup_club.*', 'signup_club.name as club_name');
                $query->orderBy('signup_patrol.sortorder');
                $query->orderBy('competitions_signups.lane');
            },
            'Signups.Club',
            'Signups.User',
            'Signups.Weaponclass',
            'Signups.Patrol',
            'Competitiontype',
            'Weaponclasses',
            'Club',
            'Club.District'
        ])->find($competitionsId);

        if($this->filter->orderby == 'patrols'):
            $this->patrols();
        elseif($this->filter->orderby == 'clubs'):
            $this->patrolsByClub();
        endif;

        $this->pageFooter($this->pdf);

        return $this->pdf->Output($this->Competition->name.' Patrols.pdf','I');
    }

    private function pageFooter($pdf)
    {
        $this->pdf->SetXY($this->leftMargin, 272);
        $this->pdf->line($this->leftMargin, 270, 210-$this->leftMargin, 270, ['width'=>$this->lineWidth,'color'=>$this->lineColor]);

        $this->addFooterLogotype($this->pdf);
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
        $this->pdf->writeHTMLCell(0, 0, 110, 11, ucfirst($this->Competition->translations->patrols_list_singular));

        $this->pdf->writeHTMLCell(70, 0, 210-$this->leftMargin-72, 11, $this->Competition->date, 0, 0, false, true, 'R');

        $this->pdf->SetFont('helvetica', '', $this->fontSize-5);
        $this->pdf->SetXY(110, $this->pdf->GetY()+10);
        $this->Competition->fullname = $this->Competition->name;
        $this->Competition->fullname .= ' | ';
        $this->Competition->fullname .= $this->Competition->Competitiontype->name;
        $this->Competition->fullname .= ' | ';
        foreach($this->Competition->Weaponclasses as $weaponclass):
            $this->Competition->fullname .= ($this->Competition->championships_id) ? $weaponclass->classname_general : $weaponclass->classname.' ';
        endforeach;
        $this->pdf->cell(0, 0, $this->Competition->fullname);
        $this->pdf->SetXY(0, 29);
    }

    public function patrols()
    {
        if($this->Competition->Patrols):
            $this->Competition->Patrols->each(function($patrol, $index){
                if($this->filter->pagebreak || $index == 0){
                    $this->pageHeader();
                }
                $this->pdf->SetFont('helvetica', '', $this->fontSize-5);

                $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY()+3, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
                $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+4);

                $this->pdf->cell($this->signupCells[0], 6, ucfirst($this->Competition->translations->patrols_name_singular), '', 0, 'L' );
                $this->pdf->cell($this->signupCells[1], 6, ucfirst($this->Competition->translations->patrols_lane_singular), '', 0, 'L' );
                $this->pdf->cell($this->signupCells[2], 6, _('Namn'), '', 0, 'L' );
                $this->pdf->cell($this->signupCells[3], 6, _('Förening'), '', 0, 'L' );
                $this->pdf->cell($this->signupCells[4], 6, _('Vapengrupp'), '', 1, 'R' );

                $this->pdf->SetY($this->pdf->GetY()+4);

                $patrol->Signups->each(function($signup, $index) use ($patrol){
                    $this->pdf->SetFont('helvetica', '', $this->fontSize-2);
                    $this->pdf->SetX($this->leftMargin+2);
                    $this->pdf->cell($this->signupCells[0], 4, $patrol->sortorder.' ('.date('H:i', strtotime($patrol->start_time)).')', '', 0, 'L' );
                    $this->pdf->cell($this->signupCells[1], 4, $signup->lane, '', 0, 'L' );
                    $this->pdf->cell($this->signupCells[2], 4, $signup->User->fullName, '', 0, 'L' );
                    $this->pdf->cell($this->signupCells[3], 4, substr($signup->Club->name,0,35), '', 0, 'L' );
                    $this->pdf->cell($this->signupCells[4], 4, ($this->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname, '', 1, 'R' );
                });
            });
        endif;
    }

    public function patrolsByClub()
    {
        if($this->Competition->Signups):

            $clubs = $this->Competition->Signups->groupBy('clubs_id');

            $index = 0;
            foreach($clubs as $club):
                if($this->filter->pagebreak || $index == 0) $this->pageHeader();

                $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY()+3, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
                $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+4);

                $this->pdf->cell($this->signupCells[0], 6, ucfirst($this->Competition->translations->patrols_name_singular), '', 0, 'L' );
                $this->pdf->cell($this->signupCells[1], 6, ucfirst($this->Competition->translations->patrols_lane_singular), '', 0, 'L' );
                $this->pdf->cell($this->signupCells[2], 6, _('Namn'), '', 0, 'L' );
                $this->pdf->cell($this->signupCells[3], 6, _('Förening'), '', 0, 'L' );
                $this->pdf->cell($this->signupCells[4], 6, _('Vapengrupp'), '', 1, 'R' );

                $this->pdf->SetY($this->pdf->GetY()+4);
                $signups = $club->sortBy('patrols_id');

                $signups->each(function($signup){
                    $this->pdf->SetFont('helvetica', '', $this->fontSize-1);
                    $this->pdf->SetX($this->leftMargin+2);
                    if($signup->Patrol):
                        $this->pdf->cell($this->signupCells[0], 4, $signup->Patrol->sortorder.' ('.date('H:i', strtotime($signup->Patrol->start_time)).')', '', 0, 'L' );
                        $this->pdf->cell($this->signupCells[1], 4, $signup->lane, '', 0, 'L' );
                    else:
                        $this->pdf->cell($this->signupCells[0]+$this->signupCells[1], 4, _('Ingen %s', $this->Competition->translations->patrols_name_singular), '', 0, 'L' );
                    endif;
                    $this->pdf->cell($this->signupCells[2], 4, $signup->User->fullName, '', 0, 'L' );
                    $this->pdf->cell($this->signupCells[3], 4, $signup->Club->name, '', 0, 'L' );
                    $this->pdf->cell($this->signupCells[4], 4, ($this->Competition->championships_id) ? $signup->Weaponclass->classname_general : $signup->Weaponclass->classname, '', 1, 'R' );
                });
                $index++;
            endforeach;

        endif;
    }

}