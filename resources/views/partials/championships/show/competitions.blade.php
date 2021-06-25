<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                {{_('Tävlingar')}}
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-bordered table-striped ">
                    <thead>
                        <tr>
                            <th>{{_('Datum')}}</th>
                            <th>{{_('Tävling')}}</th>
                            <th>{{_('Status')}}</th>
                            <th>{{_('Typ av tävling')}}</th>
                            <th>{{_('Vapengrupper')}}</th>
                            
                            <th>{{_('Ort/stad')}}</th>
                            <th>{{_('Anmälningar')}}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr ui-sref="competition.show({id: competition.id, view: 'information'})" ng-repeat="competition in championships.championship.competitions">
                            <td class="text-nowrap"><% competition.date %></td>
                            <td><% competition.name %></td>
                            <td><% competition.status_human %></td>
                            <td><% competition.competitiontype.name %></td>
                            
                            <td><% competition.contact_city %></td>
                            <td><span ng-repeat="weapongroup in competition.weapongroups" class="label label-default margin-right-5 inline-block"><% weapongroup.name %></span></td>
                            <td class="text-right">
                                <% competition.signups_count %>
                            </td>
                            <td><a ui-sref="competition.show({id: competition.id, view: 'information'})" class="btn btn-primary btn-xs">Visa</a></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>


