<div class="panel panel-default">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Datum och tider')}}</div>
        </div>
    </div>
    <table class="table table-bordered">
        <tbody>
        <tr>
            <td class="col-sm-4">{{_('Datum')}}</td>
            <td><div uib-datepicker ng-model="competitions.competition.date" class="margin-bottom-0"></div></td>
        </tr>
        <tr>
            <td>{{_('Start tid')}}</td>
            <td>
                <div uib-timepicker ng-model="competitions.competition.start_time" mousewheel="false" hour-step="1" minute-step="1" show-meridian="ismeridian"></div>
            </td>
        </tr>
        <tr>
            <td>{{_('Final tid')}}</td>
            <td>
                <div uib-timepicker ng-model="competitions.competition.final_time" mousewheel="false" hour-step="1" minute-step="1" show-meridian="ismeridian"></div>
            </td>
        </tr>
        </tbody>
    </table>
    <div class="panel-footer">
        <button class="btn btn-primary" ng-click="competitions.update()">{{_('Spara')}}</button>
    </div>
</div>
