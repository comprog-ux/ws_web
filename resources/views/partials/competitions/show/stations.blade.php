<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Stationer')}}</div>
        </div>
    </div>

    <table class="table table-striped table-bordered">
        <thead>
        <tr>
            <th>{{_('Figurer')}}</th>
            <th>{{_('Skott')}}</th>
            <th>{{_('Poängräkning')}}</th>
        </tr>
        </thead>
        <tbody>
        <tr ng-repeat="station in competitions.competitions.stations">
            <td><% station.figures %></td>
            <td><% station.shots %></td>
            <td>
                <span ng-if="station.points" class="label label-primary">Poängräkning</span>
            </td>
        </tr>
        </tbody>
    </table>
</div>
