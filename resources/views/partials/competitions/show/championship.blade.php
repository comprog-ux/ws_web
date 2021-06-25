<div class="panel panel-default" ng-if="competitions.competitions.championship">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Tävlingar inom samma mästerskap')}}: <% competitions.competitions.championship.name %></div>
        </div>
    </div>

    <div class="table-responsive">

        <table class="table table-hover table-bordered table-striped">
            <thead>
            <tr>
                <th>{{_('Datum')}}</th>
                <th>{{_('Tävling')}}</th>
                <th>{{_('Status')}}</th>
                <th>{{_('Typ av tävling')}}</th>
                
                <th>{{_('Ort/stad')}}</th>
                <th>{{_('Vapengrupper')}}</th>
                <th>{{_('Anmäld')}}</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            
            <tr ng-repeat="competition in competitions.competitions.championship.competitions | filter:{id: '!' + competitions.competitions.id}:true">
                <td ui-sref="competition.show({id: competition.id, view: 'information'})" class="text-nowrap"><% competition.date %></td>
                <td ui-sref="competition.show({id: competition.id, view: 'information'})"><% competition.name %></td>
                <td ui-sref="competition.show({id: competition.id, view: 'information'})"><% competition.status %></td>
                <td ui-sref="competition.show({id: competition.id, view: 'information'})"><% competition.competitiontype.name %></td>
                
                <td ui-sref="competition.show({id: competition.id, view: 'information'})"><% competition.contact_city %></td>
                <td ui-sref="competition.show({id: competition.id, view: 'information'})">
                    <span ng-repeat="weaponclass in competition.weaponclasses" class="label label-default margin-right-5"><% (competition.championships_id) ? weaponclass.classname_general : weaponclass.classname %></span>
                </td>
                <td>
                    <span ng-repeat="weaponclass in competition.weaponclasses">
                        <a ui-sref="signup({id: signup.id})" class="label label-primary margin-right-5" ng-repeat="signup in usersignups = (competition.usersignups | filter:{weaponclasses_id: weaponclass.id}: true)"><% (competition.championships_id) ? weaponclass.classname_general : weaponclass.classname %></a>
                    </span>
                </td>
                <td class="text-right"><a ui-sref="competition.show({id: competition.id, view: 'information'})" class="btn btn-primary btn-sm">Visa</a></td>
            </tr>
            </tbody>
        </table>
    </div>
</div>
