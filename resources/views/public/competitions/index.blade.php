<ui-view>

    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    {{_('Tävlingar')}}
                </div>
                <div class="panel-body visible-xs">
                    <div class="grid-striped">
                        <div class="row" ui-sref="public.competitions.show({id: competition.id})" ng-repeat="competition in competitions.competitions">
                            <div class="col-sm-12 padding-left-10 padding-top-15 padding-right-10 padding-bottom-15">
                                <div class="container-fluid">
                                <div class="row">
                                    <h4 class="text-uppercase margin-0"><% competition.name %></h4>
                                    <span ng-if="competition.championship"><% (competition.championship.name) ? competition.championship.name : '-' %></span>
                                    <div class="row">
                                        <div class="col-xs-6"><% competition.date %></div>
                                        <div class="col-xs-6 text-right"><% competition.signups_count %> {{_('anmälda')}}</div>
                                    </div>
                                    <div class="row">
                                        <div class="col-xs-6"><% competition.competitiontype.name %></div>
                                        <div class="col-xs-6 text-right"><% competition.status_human %></div>
                                    </div>
                                    <div><span ng-repeat="weapongroup in competition.weapongroups" class="label label-default margin-right-5 inline-block"><% weapongroup.name %></span></div>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="table-responsive hidden-xs">
                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>{{_('Datum')}}</th>
                                <th>{{_('Tävling')}}</th>
                                <th>{{_('Status')}}</th>
                                <th>{{_('Mästerskap')}}</th>
                                <th>{{_('Typ av tävling')}}</th>
                                <th>{{_('Ort/stad')}}</th>
                                <th>{{_('Vapenklasser')}}</th>
                                <th>{{_('Anmälningar')}}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ui-sref="public.competitions.show({id: competition.id})" ng-repeat="competition in competitions.competitions">
                                <td class="text-nowrap"><% competition.date %></td>
                                <td><% competition.name %></td>
                                <td><% competition.status_human %></td>
                                <td><% (competition.championship.name) ? competition.championship.name : '-' %></td>
                                <td><% competition.competitiontype.name %></td>                            
                                <td><% competition.contact_city %></td>
                                <td><span ng-repeat="weapongroup in competition.weapongroups" class="label label-default margin-right-5 inline-block"><% weapongroup.name %></span></td>
                                <td class="text-right"><% competition.signups_count %></td>
                                <td><a ui-sref="public.competitions.show({id: competition.id})" class="btn btn-primary btn-xs">Visa</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</ui-view>
