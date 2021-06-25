<div class="panel panel-primary">
    <div class="panel-heading">
        {{_('Översikt')}}
    </div>
    <div class="panel-body text-center">
        <div class="row">
            <div class="col-sm-3">
                <h3 class="text-muted">{{_('Användare')}}</h3>
                <h2 class="text-success"><% dashboard.data.users_count %></h2>
            </div>
            <div class="col-sm-3">
                <h3 class="text-muted">{{_('Administratörer')}}</h3>
                <h2 class="text-success"><% dashboard.data.admins_count %></h2>
            </div>
            <div class="col-sm-3">
                <h3 class="text-muted">{{_('Föreningar')}}</h3>
                <h2 class="text-success"><% dashboard.data.clubs_count %></h2>
            </div>
            <div class="col-sm-3">
                <h3 class="text-muted">{{_('Fakturor')}}</h3>
                <h2 class="text-success"><% dashboard.data.invoices_count %></h2>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-3">
                <h3 class="text-muted">{{_('Tävlingar')}}</h3>
                <h2 class="text-success"><% dashboard.data.competitions_count %></h2>
            </div>
            <div class="col-sm-3">
                <h3 class="text-muted">{{_('Anmälningar')}}</h3>
                <h2 class="text-success"><% dashboard.data.signups_count %></h2>
            </div>
            <div class="col-sm-3">
                <h3 class="text-muted">{{_('Lag')}}</h3>
                <h2 class="text-success"><% dashboard.data.teams_count %></h2>
            </div>
            <div class="col-sm-3">
                <h3 class="text-muted">{{_('Premium')}}</h3>
                <h2 class="text-success"><% dashboard.data.clubs_premium_count %></h2>
            </div>
        </div>

    </div>
</div>
