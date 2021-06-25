<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Information')}}</div>
        </div>
    </div>

    <table class="table table-bordered">
        <tbody>
        <tr>
            <td>{{_('Datum')}}</td>
            <td><% competitions.competitions.date %></td>
        </tr>
        <tr>
            <td>{{_('Tävlingsgrupp')}}</td>
            <td><% competitions.competitions.championship.name %></td>
        </tr>
        <tr ng-if="competitions.competitions.competitiontype">
            <td>{{_('Tävlingstyp')}}</td>
            <td><% competitions.competitions.competitiontype.name %></td>
        </tr>
        <tr>
            <td>{{_('Vapenklasser')}}</td>
            <td>
                <span ng-repeat="weaponclass in competitions.competitions.weaponclasses" class="label label-default margin-right-5"><% (competitions.competitions.championship) ? weaponclass.classname_general : weaponclass.classname %></span>
            </td>
        </tr>
        <tr>
            <td>{{_('Webbplats')}}</td>
            <td>
                <a href="<% competitions.competitions.website %>" target="_blank" ng-if="competitions.competitions.website"><% competitions.competitions.website %></a>
                <span ng-if="!competitions.competitions.website">-</span>
            </td>
        </tr>
        </tbody>
    </table>

</div>
