<?php

namespace App\Jobs;

use App\Contracts\ExcelInterface;
use App\Models\Club;
use App\Models\User;
use App\Notifications\UsersImported;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use \Storage;

class ImportUsers implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public $filename;
    public $user;
    public $newRows      = 0;
    public $existingRows = 0;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($filename, User $user)
    {
        $this->filename = $filename;
        $this->user     = $user;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $data = $this->readExcelFile();

        $this->user->load('DistrictsAdmin.Clubs');

        // The user only has access to modify users within clubs associated with their district.
        $userClubs = $this->user->DistrictsAdmin->flatMap(function ($row) {
            return $row->Clubs->pluck('clubs_nr');
        });

        // Filter out rows not in the users districts.
        $data = $data->filter(function ($row) use ($userClubs) {
            return (in_array($row['clubs_nr'], $userClubs->toArray()));
        });

        $data->each(function ($row) {
            $row['gender']   = $this->parseGender($row);
            $row['birthday'] = $this->parseBirthday($row);

            $user = $this->findOrCreateUser($row);
            $user->load('Clubs');

            $club = Club::where('clubs_nr', $row['clubs_nr'])->first();

            $this->attachClubToUser($club, $user);
        });

        $this->user->notify(new UsersImported($this->newRows, $this->existingRows));

        $this->cleanUp();
    }

    /**
     * Converts the gender provided into a value we can store in the database.
     *
     * @param  array $row
     * @return string
     */
    private function parseGender($row)
    {
        if (empty($row['gender'])) {
            return '';
        }

        return (strtolower($row['gender']) == 'man') ? 'male' : 'female';
    }

    /**
     * Turns the year provided in the file into a full date such as YYYY-01-01.
     *
     * @param  array $row
     * @return string
     */
    private function parseBirthday($row)
    {
        if (empty($row['birthday'])) {
            return '0000-00-00';
        }

        return $row['birthday'] . '-01-01';
    }

    /**
     * Attaches given club to the given user if it isn't already attached.
     *
     * @param  Club $club
     * @param  User $user
     * @return void
     */
    private function attachClubToUser($club, $user)
    {
        if ($user->Clubs->contains($club->id)) {
            return false;
        }

        $user->Clubs()->attach($club->id);
    }

    /**
     * Creates or uses the first user with given shoorting card number and email combined.
     *
     * @param  array $row
     * @return User
     */
    private function findOrCreateUser($row)
    {
        $user = User::firstOrNew([
            'shooting_card_number' => $row['shooting_card_number'],
            'email'                => $row['email'],
        ]);

        if ($user->id) {
            $this->existingRows++;
        } else {
            $this->newRows++;
        }

        $user->fill($row);
        $user->save();

        return $user;
    }

    /**
     * Reads the rows in the uploaded import file and parses them into a format
     * the job can write to the database.
     *
     * @return collection
     */
    private function readExcelFile()
    {
        $excel = app()->make(ExcelInterface::class);
        $data  = $excel->getFirstSheetRows(storage_path('app/user-imports/' . $this->filename));

        return $data->map(function ($row) {
            return [
                'clubs_nr'             => (string) $row[0],
                'club_name'            => $row[1],
                'name'                 => $row[2],
                'lastname'             => $row[3],
                'email'                => (!empty($row[4])) ? $row[4] : '',
                'mobile'               => (!empty($row[5])) ? $row[5] : '',
                'phone'                => (!empty($row[6])) ? $row[6] : '',
                'gender'               => (!empty($row[7])) ? $row[7] : '',
                'birthday'             => (!empty($row[8])) ? (string) $row[8] : '',
                'shooting_card_number' => (!empty($row[9])) ? (string) $row[9] : '',
                'grade_trackshooting'  => (!empty($row[10])) ? (int) $row[10] : '',
                'grade_field'          => (!empty($row[11])) ? (int) $row[11] : '',
            ];
        });
    }

    /**
     * Cleans up stored files after the command is finished.
     *
     * @return void
     */
    private function cleanUp()
    {
        Storage::disk('local')->delete('user-imports/' . $this->filename);
    }
}
