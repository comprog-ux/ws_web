<!DOCTYPE html>
   <html>
   <head>
<style>
div.relative {
  position: relative;
  left: -20px;  
}
</style>
</head>
<body>
   
   <link href="{{ asset('css/background.css') }}" rel="stylesheet">
@include('layouts.header')
<a href="http://localhost:8080/app/" class="navbar-brand" ui-sref="dashboard"><img src="{{url('img/webshooter-logo-2.png')}}" class="logo"></a>

<div class="relative">
<a href="http://localhost:8080/app/" style="text-align: right;"><h3>Tillbaka </h3></a>
</div>


@extends('layouts.app')
@section('content')
 

<div class="row padding-left-20 padding-top-0 padding-bottom-10 background-color-primary text-white">
<p style="text-align: center;"> <h2>Skapa förening</h2> <h4>Kontrollera noga att förening och klubbnummer inte redan finns</h4></p>
</div>
<nav class="navbar navbar-nav margin-top-10">
<br>
    {!! Form::open(['action' => 'CreateClubsController@store', 'method' => 'POST', 'enctype' => 'multipart/form-data']) !!}
        <div class="form-group">
            {{Form::label('name', 'Namn, fordras')}}
            {{Form::text('name', '', ['class' => 'form-control', 'placeholder' => 'Föreningens namn (name)'])}}
            <br>
            <br>
            {{Form::label('clubs_nr', 'Nummer fordras')}}
            {{Form::text('clubs_nr', '', ['class' => 'form-control', 'placeholder' => 'Klubb-nummer(clubs nr)'])}}
            <br>
            <br>
            {{Form::label('districts_id', 'Krets-id')}}
            {{Form::text('districts_id', '', ['class' => 'form-control', 'placeholder' => 'Krets-id'])}}
            <br>
        </div>
        <br>
        {{Form::submit('UTFÖR', ['class'=>'btn btn-primary'])}}
    {!! Form::close() !!}
@endsection

</body>
</html>
