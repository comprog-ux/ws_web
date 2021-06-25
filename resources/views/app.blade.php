@include('layouts.header')
<script>
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
				(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
</script>


	<base href="/">
	<div ui-view="navigation" class="hidden-print"></div>

	<div class="row hidden-print" ng-show="loadingState">
		 <div class="col-sm-2 col-sm-offset-5 text-center text-muted padding-top-30 padding-bottom-30">
			 <div class='uil-default-css'>
				 <div style='top:60px;left:96px;width:8px;height:80px;background:#00ABAA;-webkit-transform:rotate(0deg) translate(0,-60px);transform:rotate(0deg) translate(0,-60px);border-radius:0px;position:absolute;'></div>
				 <div style='top:60px;left:96px;width:8px;height:80px;background:#00ABAA;-webkit-transform:rotate(90deg) translate(0,-60px);transform:rotate(90deg) translate(0,-60px);border-radius:0px;position:absolute;'></div>
				 <div style='top:60px;left:96px;width:8px;height:80px;background:#00ABAA;-webkit-transform:rotate(180deg) translate(0,-60px);transform:rotate(180deg) translate(0,-60px);border-radius:0px;position:absolute;'></div>
				 <div style='top:60px;left:96px;width:8px;height:80px;background:#00ABAA;-webkit-transform:rotate(270deg) translate(0,-60px);transform:rotate(270deg) translate(0,-60px);border-radius:0px;position:absolute;'></div>
			 </div>
		 </div>
	</div>

	<div class="container-fluid" ng-hide="loadingState">
		<div class="row">
			<div class="col-sm-12">
				@include('alerts.factorymessages')
				<div ui-view="content"></div>
			</div>
		</div>
	</div>

@include('layouts.footer')