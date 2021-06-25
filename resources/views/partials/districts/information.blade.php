<div class="panel panel-default hide" ng-class="{'show': !(district.district | isEmpty)}">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Kretsinformation')}}</div>
        </div>
    </div>

    <table class="table table-bordered">
        <tbody>
        <tr>
            <td>{{_('Namn')}}</td>
            <td><% district.district.name %></td>
        </tr>
        <tr>
            <td>{{_('Nummer')}}</td>
            <td><% district.district.districts_nr %></td>
        </tr>
        <tr>
            <td>{{_('E-postadress')}}</td>
            <td><% district.district.email %></td>
        </tr>
        <tr>
            <td>{{_('Telefon')}}</td>
            <td><% district.district.phone %></td>
        </tr>
        <tr>
            <td>{{_('Adress')}}</td>
            <td class="break-lines"><% district.district.address_combined %></td>
        </tr>
        <tr>
            <td>{{_('Swish')}}</td>
            <td><% district.district.swish %></td>
        </tr>
        <tr>
            <td>{{_('Bankgiro')}}</td>
            <td><% district.district.bankgiro %></td>
        </tr>
        <tr>
            <td>{{_('Postgiro')}}</td>
            <td><% district.district.postgiro %></td>
        </tr>
        <tr>
            <td>{{_('Logotyp')}}</td>
            <td>
                <img ng-src="<% district.district.logo_url %>" ng-if="district.district.logo_url" class="img-responsive" style="max-width: 400px">
            </td>
        </tr>
        </tbody>
    </table>

    <div class="panel-body">
        <button class="btn btn-primary" ui-sref="districts.show.edit({districts_id: district.district.id})">{{_('Ändra information')}}</button>
    </div>

</div>
