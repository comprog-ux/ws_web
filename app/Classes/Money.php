<?php
namespace App\Classes;

class Money {
	public static function format($value, $format=null)
	{
		$format = ($format) ? $format : '%!.0n';
		$value = ($value) ? str_replace(',', '.', $value) : 0;
		return money_format($format, $value);
	}
	
	public static function getFormats()
	{
		// IMPORTANT! If modifying these, also update the formatDecimals-array in the 
		// noFractionCurrency-filter in angular.app.js!

		$moneyFormats = array(
			#'%.0n' 	=> money_format('%.0n', 12345),
			#'%.2n' 	=> money_format('%.2n', 12345),
			#'%.0i' 	=> money_format('%.0i', 12345),
			#'%i' 	=> money_format('%i', 12345),
			'%!.0n' 	=> money_format('%!.0n', 12345),
			'%!2n' 	=> money_format('%!2n', 12345),
			);
		return $moneyFormats;
	}
	
	public static function getCurrencies()
	{
		$currencies = [
			'$' => '$',
			'€' => '€',
			'kr' => 'kr'
		];
		return $currencies;
	}
	
	public static function humanCurrency($currency)
	{
		$currencies = [
			'$' => 'usd',
			'€' => 'eur',
			'kr' => 'sek'
		];
		return $currencies[$currency];
	}
	
	/**
	 * Returns the default fallback currency.
	 *
	 * @return string
	 */
	public static function getDefaultCurrency()
	{
		return '€';
	}
}