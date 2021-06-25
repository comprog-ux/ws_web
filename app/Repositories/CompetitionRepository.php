<?php
namespace App\Repositories;

use Illuminate\Support\Facades\App;
use Illuminate\Http\Request;

class CompetitionRepository
{
    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function generateTeamsPdf($competitionsId)
    {
        $pdf = new \App\Classes\pdfTeams();
        $pdf->create($competitionsId, $this->request->all());
    }
    public function generateSignupsPdf($competitionsId)
    {
        $pdf = new \App\Classes\pdfSignups();
        $pdf->create($competitionsId, $this->request->all());
    }
    public function generateShootingcardsPdf($competitionsId)
    {
        $pdf = new \App\Classes\pdfShootingcards();
        $pdf->create($competitionsId, $this->request->all());
    }
}