<div class="panel panel-default hide" ng-class="{'show': !(club.club | isEmpty)}">
    <div class="panel-heading">
        <div class="row">
            <div class="col-sm-6">{{_('Förenings information')}}</div>
        </div>
    </div>

    <table class="table table-bordered">
        <tbody>
        <tr>
            <td>{{_('Namn')}}</td>
            <td><% club.club.name %></td>
        </tr>
        <tr>
            <td>{{_('Nummer')}}</td>
            <td><% club.club.clubs_nr %></td>
        </tr>
        <tr>
            <td>{{_('Krets')}}</td>
            <td><% club.club.district.districts_nr+' '+club.club.district.name %></td>
        </tr>
        <tr>
            <td>{{_('E-postadress')}}</td>
            <td><% club.club.email %></td>
        </tr>
        <tr>
            <td>{{_('Telefon')}}</td>
            <td><% club.club.phone %></td>
        </tr>
        <tr>
            <td>{{_('Adress')}}</td>
            <td class="break-lines"><% club.club.address_combined %></td>
        </tr>
        <tr>
            <td>{{_('Swish')}}</td>
            <td><% club.club.swish %></td>
        </tr>
        <tr>
            <td>{{_('Bankgiro')}}</td>
            <td><% club.club.bankgiro %></td>
        </tr>
        <tr>
            <td>{{_('Postgiro')}}</td>
            <td><% club.club.postgiro %></td>
        </tr>
        <tr>
            <td>{{_('Personliga fakturor för medlemmar')}}</td>
            <td><% (club.club.disable_personal_invoices) ? 'Endast föreningen kan skapa fakturor åt medlemmar' : 'Medlemmar kan skapa sina personliga fakturor' %></td>
        </tr>
        <tr>
            <td>{{_('Logotyp')}}</td>
            <td>
                <img ng-src="<% club.club.logo_url %>" ng-if="club.club.logo_url" class="img-responsive" style="max-width: 400px">
            </td>
        </tr>
        </tbody>
    </table>

    <div class="panel-body" ng-if="club.club.user_has_role=='admin'">
        <button class="btn btn-primary" ui-sref="club.edit">{{_('Ändra information')}}</button>
    </div>
</div>
