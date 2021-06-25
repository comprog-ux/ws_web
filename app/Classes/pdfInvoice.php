<?php
namespace App\Classes;
use App\Models\Invoice;
use App\Models\Club;
class pdfInvoice extends BasePDF {

	public function __construct() {
		$this->leftMargin = 10;
		$this->topMargin = 20;
		$this->footerMargin = 30;
		$this->fontSize = 10;
		$this->fontColor = '70';
		$this->borderRadius = 2;
		$this->fillColor = [240,240,240];
		$this->lineColor = [200,200,200];
		$this->lineWidth = 0.1;
		$this->color1 = '#ffffff';
		$this->color2 = '#f0f0f0';
		$this->itemCells = [112, 24, 26, 24];
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

	public function create($invoiceId)
	{
		
		$this->pdf = new \TCPDF();
		$this->pdfSettings($this->pdf);
		$this->invoiceId = $invoiceId;
		$this->destination = 'I';
		$this->invoice = Invoice::with('InvoiceRows')->find($invoiceId);
		//company name
		$this->invoiceHeader($this->pdf);

		//details
		//if($this->invoice->vat_nr):
		//	$this->pdf->writeHTMLCell(80, 6, $this->leftMargin, 88, _('Moms nr').': '.$this->invoice->vat_nr, 0, 0);
		//endif;

		//Sum & Vat
		$this->invoiceSum($this->pdf);
		$this->invoiceVat($this->pdf);

		$this->invoiceFooter($this->pdf);

		//items
		$this->invoiceItems($this->pdf);
		
		return $this->pdf->Output('invoice-'.$this->invoice->invoice_reference.'.pdf','I');
	}
	
	public function invoiceHeader($pdf)
	{
		$pdf->AddPage();
		$pdf->SetFont('helvetica', '', $this->fontSize+10);
		$logotype = public_path().'/img/webshooter-logo.png';

		// Use the sender logo if they have uploaded one.
		if($this->invoice->sender_type === 'App\Models\Club'){
			$sender = Club::find($this->invoice->sender_id);
			if($sender->logo){
				$logotype = storage_path('app/public/clubs/'.$sender->id.'/'.$sender->logo);
			}
		}

		$logoDimensions = $this->getLogoDimensions($logotype);
		
		$pdf->Image($logotype, $pdf->GetX(), $pdf->GetY(), $logoDimensions['width'], $logoDimensions['height']);

		//invoice nr
		$pdf->SetFont('helvetica', '', $this->fontSize+10);
		$pdf->RoundedRect(210-$this->leftMargin-92, 10, 92, 18, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
		if(!$this->invoice->creditnote_id && !$this->invoice->is_creditnote):
			$pdf->writeHTMLCell(0, 0, 110, 11, _('Faktura'));
		else:
			$pdf->writeHTMLCell(0, 0, 110, 11, _('Kreditfaktura'));
		endif;
		$pdf->writeHTMLCell(70, 0, 210-$this->leftMargin-72, 11, $this->invoice->invoice_reference, 0, 0, false, true, 'R');

		//invoice date
		$pdf->SetFont('helvetica', '', $this->fontSize);
		$pdf->SetXY(110, $pdf->GetY()+10);
		$pdf->cell(0, 0, _('Fakturadatum').' '.$this->invoice->invoice_date);

		//contact
		$pdf->SetXY(110, 44);
		$pdf->MultiCell(80, 6, $this->invoice->recipient_name."\n\r".$this->invoice->recipient_address_combined, 0, 'L', false, 1);

		/*
		#$pdf->writeHTMLCell(80, 20, 110, 44, View::make('invoices.pdf.client',['invoice'=>$this->invoice]));
		*/
		//Big total amount
		$pdf->RoundedRect(210-$this->leftMargin-105, 85, 105, 16, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
		$pdf->SetFont('helvetica', '', $this->fontSize+9);
		if($this->invoice->sum_amount >= 0):
			$pdf->writeHTMLCell(103, 6, 210-$this->leftMargin-103, 89, _('Belopp att betala'));
		else:
			$pdf->writeHTMLCell(103, 6, 210-$this->leftMargin-103, 89, _('Belopp att erhålla'));
		endif;
		$pdf->writeHTMLCell(70, 0, 210-$this->leftMargin-72, 89, Money::format($this->invoice->sum_amount, '%!.0n').' '.$this->invoice->currency, 0, 0, false, true, 'R');
		$pdf->SetFont('helvetica', '', $this->fontSize);

		//Big total amount
		$pdf->RoundedRect(210-$this->leftMargin-105, 104, 105, 11, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
		if($this->invoice->sender_swish):
			$pdf->writeHTMLCell(103, 6, 210-$this->leftMargin-103, 107, _('Swish').' '.$this->invoice->sender_swish);
		elseif($this->invoice->sender_bankgiro):
			$pdf->writeHTMLCell(103, 6, 210-$this->leftMargin-103, 107, _('Bankgiro').' '.$this->invoice->sender_bankgiro);
		elseif($this->invoice->sender_postgiro):
			$pdf->writeHTMLCell(103, 6, 210-$this->leftMargin-103, 107, _('Postgiro').' '.$this->invoice->sender_postgiro);
		endif;
		$pdf->writeHTMLCell(70, 0, 210-$this->leftMargin-72, 107, _('Förfallodatum').' '.$this->invoice->expiration_date, 0, 0, false, true, 'R');
		$pdf->SetFont('helvetica', '', $this->fontSize);
	}

	/**
	 * List invoice items
	 * @param object
	 * @return void
	 */
	private function invoiceItems($pdf)
	{
		//items
		$pdf->RoundedRect($this->leftMargin, 119, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
		$pdf->SetXY($this->leftMargin+2, 120);
		//Items Header
		$pdf->cell($this->itemCells[0], 6, _('Beskrivning'), '', 0, 'L' );
		$pdf->cell($this->itemCells[1], 6, _('Antal'), '', 0, 'R' );
		$pdf->cell($this->itemCells[2], 6, _('Pris'), '', 0, 'R' );
		$pdf->cell($this->itemCells[3], 6, _('Summa'), '', 1, 'R' );
		// Start item listing
		$pdf->SetFont('helvetica', '', $this->fontSize-1);
		$row_count = 0;

		$posY = $pdf->GetY()+5;
		foreach($this->invoice->InvoiceRows as $this->invoiceitem):
			$itemContinued = false;

			//Set start position and store in current position
			$pdf->SetXY($this->leftMargin+2, $posY);
			$currentY = $posY;
			//Add Description cell
			$description = $this->invoiceitem->description;
			$pdf->MultiCell($this->itemCells[0], 4, $description, 0, 'L', false, 1 );
			//Go back to start position and next column
			$posY = ($pdf->GetY() > $posY+4) ? $pdf->GetY()+2 : $posY;
			$pdf->SetXY($this->itemCells[0]+$this->leftMargin+2, $currentY);
			//Add other cells
			$pdf->MultiCell($this->itemCells[1], 4, $this->invoiceitem->quantity, 0, 'R', false, 1);
			$posY = ($pdf->GetY() > $posY) ? $pdf->GetY()+0.5 : $posY;
			$pdf->SetXY($this->itemCells[0]+$this->itemCells[1]+$this->leftMargin+2, $currentY);
			$pdf->cell($this->itemCells[2], 4, Money::format($this->invoiceitem->net_unit_amount,'%!.0n').' '.$this->invoice->currency, '', 0, 'R', $fill=false, $link='', $stretch=0, $ignore_min_height=false, $calign='T', $valign='T');
			$pdf->cell($this->itemCells[3], 4, Money::format($this->invoiceitem->net_unit_amount * $this->invoiceitem->quantity,'%!.0n').' '.$this->invoice->currency, '', 1, 'R', $fill=false, $link='', $stretch=0, $ignore_min_height=false, $calign='T', $valign='T');

			//If cells pass available height continue on next page
			if((($pdf->getPage() == 1 && $pdf->GetY() > 215) || ($pdf->getPage() > 1 && $pdf->GetY() > 275)) && !$itemContinued):
				#$pdf->SetX($this->leftMargin+2);
				$pdf->SetXY($this->leftMargin+2, $pdf->GetY()+4);
				$pdf->cell(array_sum($this->itemCells), 4, _('Fortsätter på nästa sida').'...', '', 0, 'L' );
				$pdf->AddPage();

				//invoice nr
				$pdf->SetFont('helvetica', '', $this->fontSize+3);
				$pdf->RoundedRect($this->leftMargin, 10, 82, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
				$pdf->writeHTMLCell(0, 0, $this->leftMargin+2, 11, _('Faktura'));
				$pdf->writeHTMLCell(80, 0, $this->leftMargin, 11, $this->invoice->invoice_reference, 0, 0, false, true, 'R');

				$pdf->RoundedRect(210-$this->leftMargin-35, 10, 35, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
				$pdf->writeHTMLCell(0, 0, 167, 11, _('Sida'));
				$pdf->writeHTMLCell(70, 0, 210-$this->leftMargin-70, 11, $pdf->getPage(), 0, 0, false, true, 'R');
				$pdf->SetFont('helvetica', '', $this->fontSize);

				$pdf->RoundedRect($this->leftMargin, $this->topMargin, 190, 8, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
				$pdf->SetXY($this->leftMargin+2, $this->topMargin+2);
				//Items Header
				$pdf->cell($this->itemCells[0], 4, _('Beskrivning'), '', 0, 'L' );
				$pdf->cell($this->itemCells[1], 4, _('Antal'), '', 0, 'R' );
				$pdf->cell($this->itemCells[2], 4, _('Pris'), '', 0, 'R' );
				$pdf->cell($this->itemCells[3], 4, _('Summa'), '', 1, 'R' );
				$posY = $pdf->GetY()+4;
				$pdf->SetFont('helvetica', '', $this->fontSize-1);
				$itemContinued = true;
			endif;
			$row_count++;
		endforeach;
	}

	/**
	 * Sum invoice
	 * @param object
	 */
	private function invoiceSum($pdf)
	{
		$pdf->RoundedRect($this->leftMargin, 252, 190, 9, $this->borderRadius, '1111', 'F',null ,$this->fillColor);
		$pdf->line($this->leftMargin+2, 230, 210-$this->leftMargin-2, 230, ['width'=>$this->lineWidth,'color'=>$this->lineColor]);
		$pdf->line(165, 230, 165, 261, ['width'=>$this->lineWidth,'color'=>$this->lineColor]);
		$pdf->SetY(230);
		$pdf->cell(153, 7, _('Netto'), '', 0, 'R');
		$pdf->cell(35, 7, Money::format($this->invoice->amount,'%!.0n').' '.$this->invoice->currency, '', 1, 'R');
		$pdf->cell(153, 7, _('Moms'), '', 0, 'R');
		$pdf->cell(35, 7, Money::format($this->invoice->vat_amount,'%!.0n').' '.$this->invoice->currency, '', 1, 'R');
		$pdf->cell(153, 7, _('Öresvrundning'), '', 0, 'R');
		$pdf->cell(35, 7, Money::format($this->invoice->sum_rounding,'%!.0n').' '.$this->invoice->currency, '', 1, 'R');
		$pdf->SetY($pdf->GetY()+2);
		if($this->invoice->sum_amount >= 0):
			$pdf->cell(153, 7, _('Att betala'), '', 0, 'R');
		else:
			$pdf->cell(153, 7, _('Att erhålla'), '', 0, 'R');
		endif;
		$pdf->cell(35, 7, Money::format($this->invoice->sum_amount,'%!.0n').' '.$this->invoice->currency, '', 1, 'R');
	}

	/**
	 * Sum Vat
	 * @param object
	 */
	private function invoiceVat($pdf)
	{
		$pdf->SetY(231);
		foreach($this->invoice->seperatevat as $vat):
			if($vat->total > 0):
			$pdf->cell(45, 5, _('Moms belopp').' '.$vat->vat_percent.'%', '', 0, 'L');
			$pdf->cell(35, 5, Money::format($vat->total,'%!.0n').' '.$this->invoice->currency, '', 1, 'R');
			endif;
		endforeach;
	}
	
	/**
	 * Invoice footer
	 * @param object
	 * @return void
	 */
	private function invoiceFooter($pdf)
	{
		$pdf->line($this->leftMargin, 270, 210-$this->leftMargin, 270, ['width'=>$this->lineWidth,'color'=>$this->lineColor]);
		$pdf->SetXY($this->leftMargin, 272);
		$pdf->SetFont('helvetica', '', $this->fontSize-2);
		$pdf->cell(50, 4, $this->invoice->sender_name, '', 1);
		$pdf->cell(50, 4, $this->invoice->sender_address_street, '', 1);
		$pdf->cell(70, 4, $this->invoice->sender_address_zipcode.' '.$this->invoice->sender_address_city, '', 1);

		$details = [
			'BankGiro'=>$this->invoice->sender_bankgiro,
			'PostGiro'=>$this->invoice->sender_postgiro,
			'Swish'=>$this->invoice->sender_swish,
			#'BIC'=>_('BIC'),
			#'Bank'=>_('BANK')
		];
		$i=0;
		foreach($details as $key=>$text):
			if($value = $text):
				$pdf->SetXY($this->leftMargin+50, 272+($i*4));
				$pdf->cell(20, 4, $key);
				$pdf->cell(20, 4, $value, '', 1, 'R');
				$i++;
			endif;
		endforeach;

		$this->addFooterLogotype($pdf);
		/*
		if($value = Config::get('invoice.vat_number')):
			$pdf->cell(50, 4, $value, '', 1);
		endif;
		if(Config::get('invoice.ftax')):
			$pdf->cell(50, 4, _('Approved for F-tax'), '', 1);
		endif;

		$details = [
			'telephone'=>_('Telephone'),
			'fax'=>_('Fax'),
			'email'=>_('E-mail'),
			'homepage'=>_('Homepage'),
			'facebook'=>_('Facebook')
		];
		$i=0;
		foreach($details as $key=>$text):
			if($value = Config::get('invoice.'.$key)):
				$pdf->SetXY($this->leftMargin+50, 262+($i*4));
				$pdf->cell(25, 4, $text);
				$pdf->cell(50, 4, $value, '', 1);
				$i++;
			endif;
		endforeach;

		*/
	}
}