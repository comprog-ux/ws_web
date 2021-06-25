<?php namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Languages extends Model {
	
	/**
	* Returns array of allowed languages.
	*
	* @return array
	*/
	public static function allowedLanguages()
	{
		return [
			'sv' => _('Swedish'),
			'en' => _('English')
		];	
	}
	
	/**
	* The default language to use if wanted language doesn't match allowed languages.
	*
	* @return string
	*/
	public static function defaultLanguage()
	{
		return 'sv';
	}
	
	/**
	* Sets a language session. If language is given through $lang, that value is used. 
	* If not, detects browser language.
	*
	* @param  string  $lang
	* @return void
	*/
	public static function setLanguageSession($lang = null)
	{
		$allowedLanguages = Languages::allowedLanguages();
		
		// No language is specified, detect browser language.
		$language = (!is_null($lang)) ? $lang : substr(\Request::server('HTTP_ACCEPT_LANGUAGE'), 0, 2);
		
		// Default if language is not within allowed languages.
		if(!in_array($language, array_keys($allowedLanguages))):
			$language = Languages::defaultLanguage();
		endif;
		
		$langData = [
			'code' 	=> $language,
			'label' => $allowedLanguages[$language]
		];
		
		\Session::set('lang', $langData);
		
		// Set language in LaravelGettext package which will use corresponding .po file.
		switch($lang):
			case 'en':
				\LaravelGettext::setLocale('en_US');
				break;
			case 'sv':
				\LaravelGettext::setLocale('sv_SE');
				break;
		endswitch;
	}

}
