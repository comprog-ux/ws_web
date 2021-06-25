<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UsersImported extends Notification
{
    use Queueable;

    public $newRows;
    public $existingRows;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct($newRows, $existingRows)
    {
        $this->newRows      = $newRows;
        $this->existingRows = $existingRows;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)->greeting('Hej!')
            ->line($this->newRows + $this->existingRows . ' användare har importerats.')
            ->line('Antal nya användare: ' . $this->newRows)
            ->line('Antal existerande användare eller dubletter: ' . $this->existingRows)
            ->action('Logga in på Webshooter', config('app.url'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            //
        ];
    }
}
