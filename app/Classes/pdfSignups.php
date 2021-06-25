<?php

namespace App\Classes;
use App\Models\Competition;

class CustomPdf extends BasePDF {

    public $weaponclasses_id;
    public $Competition;

    //Page header
    public function Header() {
        $logotype = $this->Competition->pdf_logo_path;
        $logoDimensions = $this->getLogoDimensions($logotype);

        #$logotype = public_path().'/img/webshooter-logo.png';
        $this->Image($logotype, $this->GetX(), $this->GetY(), 0, 15);

        $this->SetFont('helvetica', '', 20);
        $this->RoundedRect(108, 10, 92, 18, 2, '1111', 'F',null, [240,240,240]);
        $this->SetX(110);
        $this->cell(88, 0, _('Anmälningslista'), '', 0, 'L');
        $this->SetX(110);
        $this->cell(88, 0, $this->Competition->date, '', 0, 'R');

        $this->SetFont('helvetica', '', 11);
        $this->SetXY(110, $this->GetY()+10);
        $this->Competition->fullname = ($this->Competition->Championship) ? $this->Competition->Championship->name : $this->Competition->name;
        $this->cell(70, 0, $this->Competition->fullname, '', 0, 'L');
        $description = $this->Competition->Competitiontype->name;
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

class pdfSignups
{
    public function __construct()
    {
        $this->leftMargin = 10;
        $this->topMargin = 10;
        $this->footerMargin = 30;
        $this->fontSize = 10;
        $this->fontColor = '30';
        $this->borderRadius = 2;
        $this->fillColor = [240, 240, 240];
        $this->lineColor = [150, 150, 150];
        $this->lineWidth = 0.1;
        $this->color1 = '#ffffff';
        $this->color2 = '#f0f0f0';
        $this->cellsWidth = [76, 98, 10]; //186
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
        $pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_TOP + 5, PDF_MARGIN_RIGHT);
        $pdf->SetAutoPageBreak(true, $this->footerMargin);
        $pdf->SetAuthor('Author');
        $pdf->SetDisplayMode('real', 'default');
        $pdf->SetFont('helvetica', '', $this->fontSize);
        $pdf->SetTextColor($this->fontColor);
    }

    public function create($competitionsId, $signupsOutput)
    {

        $this->pdf = new CustomPdf();
        $this->pdfSettings($this->pdf);

        $this->competitionsId = $competitionsId;
        $this->filter = new \stdClass();
        $this->filter->orderby = (isset($signupsOutput['orderby'])) ? $signupsOutput['orderby'] : 'patrols';
        $this->filter->pagebreak = (isset($signupsOutput['pagebreak'])) ? $signupsOutput['pagebreak'] : false;
        $filter = $this->filter;
        $this->destination = 'I';
        $this->Competition = Competition::with([
            'Championship',
            'Signups' => function ($query) use ($filter){
                $query->select('competitions_signups.*', 'users.*', 'clubs.*', 'clubs.name as clubname');
                $query->join('users', 'users.id', '=', 'competitions_signups.users_id');
                $query->join('clubs', 'clubs.id', '=', 'competitions_signups.clubs_id');
                if($filter->orderby == 'name'):
                    $query->orderBy('users.name');
                elseif($filter->orderby == 'lastname'):
                    $query->orderBy('users.lastname');
                elseif($filter->orderby == 'clubname'):
                    $query->orderBy('clubname')->orderBy('users.name');
                elseif($filter->orderby == 'weapongroup'):
                    $query->orderBy('weaponclasses_id')->orderBy('users.name');
                elseif($filter->orderby == 'weapongroup_and_clubname'):
                    $query->orderBy('weaponclasses_id')->orderBy('clubname');
                else:
                    $query->orderBy('competitions_signups.created_at');
                endif;
            },
            'Signups.Club',
            'Signups.User',
            'Signups.Weaponclass',
            'Signups.ResultsPlacements',
            'Competitiontype',
            'Weaponclasses',
            'Club',
            'Club.District'
        ])
            ->find($competitionsId);
        $this->pdf->Competition = $this->Competition;

        if($this->filter->pagebreak):
            $this->signupsGroupedByWeapongroup();
        else:
            $this->signups();
        endif;

        return $this->pdf->Output($this->Competition->name . ' ' . _('Anmälningslista') . '.pdf', 'I');
    }

    public function pageHeader()
    {
        $this->pdf->startPageGroup();
        $this->pdf->AddPage();
        /**
         * Heading columns
         */
        $this->pdf->RoundedRect($this->leftMargin, $this->pdf->GetY(), 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
        $this->pdf->SetXY($this->leftMargin+2, $this->pdf->GetY()+1);

        $this->pdf->cell($this->cellsWidth[0], 6, _('Namn'), '', 0, 'L' );
        $this->pdf->cell($this->cellsWidth[1], 6, _('Förening'), '', 0, 'L' );
        $this->pdf->cell($this->cellsWidth[2], 6, _('Vapengrupp'), '', 1, 'R' );
        $this->pdf->SetY($this->pdf->GetY()+4);

    }

    public function signupsGroupedByWeapongroup()
    {
        $weapongroups = $this->Competition->Signups->groupBy('weaponclasses_id');

        $index = 0;
        foreach($weapongroups as $index => $weapongroup):
            if($this->filter->pagebreak || $index == 0) $this->pageHeader();
            foreach ($weapongroup as $signup):
                $cp = $this->pdf->getPage();
                $this->pdf->startTransaction();
                $this->addSignup($signup);
                if($this->pdf->getPage() > $cp):
                    $this->pdf->rollbackTransaction(true);
                    $this->pageHeader();
                    $this->addSignup($signup);
                else:
                    $this->pdf->commitTransaction();
                endif;
            endforeach;
            $index++;
        endforeach;
    }

    public function signups()
    {
        $this->pageHeader();

        foreach ($this->Competition->Signups as $index => $signup):
            $cp = $this->pdf->getPage();
            $this->pdf->startTransaction();
            $this->addSignup($signup);
            if($this->pdf->getPage() > $cp):
                $this->pdf->rollbackTransaction(true);
                $this->pageHeader();
                $this->addSignup($signup);
            else:
                $this->pdf->commitTransaction();
            endif;
        endforeach;
    }

    public function addSignup($signup)
    {
        $this->pdf->SetX($this->leftMargin+2);
        $this->pdf->cell($this->cellsWidth[0], 4, $signup->user->fullname, '', 0, 'L' );
        $this->pdf->cell($this->cellsWidth[1], 4, $signup->club->name, '', 0, 'L' );
        $this->pdf->cell($this->cellsWidth[2], 4, $signup->weaponclass->classname, '', 1, 'R' );
    }

}