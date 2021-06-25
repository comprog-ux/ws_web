<div class="panel panel-default" ng-if="clubs.club.invoices_outgoing.length">
    <div class="panel-heading">{{_('Utgående Fakturor')}}</div>
    <div class="panel-body">
        <div class="row">
            <div class="col-sm-8 col-sm-offset-4">
                <div class="input-group">
                    <input type="text" ng-model="club.filter.invoices.search" class="form-control" placeholder="{{_('Sök')}}" aria-describedby="sizing-search">
                    <span class="input-group-addon"><i class="fa fa-search"></i></span>
                </div>
            </div>
        </div>
    </div>

    <div class="table-responsive">
        <table class="table table-hover table-bordered">
            <thead>
                <tr>
                    <th>{{_('Datum')}}</th>
                    <th>{{_('Fakturnr')}}</th>
                    <th>{{_('Mottagare')}}</th>
                    <th>{{_('Status')}}</th>
                    <th class="text-right">{{_('Anmälningar')}}</th>
                    <th class="text-right">{{_('Lag')}}</th>
                    <th class="text-right">{{_('Summa')}}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr ng-repeat="invoice in clubs.club.invoices_outgoing | filter: club.filter.invoices.search">
                    <td ui-sref="admin.invoices.show({id:invoice.id})"><% invoice.invoice_date %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})"><% invoice.invoice_reference %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})"><% invoice.recipient_name %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})" class="nowrap"><% invoice.payment_status %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})" class="text-right"><% invoice.signups_count %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})" class="text-right"><% invoice.teams_count %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})" class="text-right"><% invoice.amount %></td>
                    <td class="text-right">
                        <button ng-click="invoices.download(invoice);" class="btn btn-xs btn-default"><i class="fa fa-download"></i> Ladda ner</button>
                        <button class="btn btn-xs btn-default" ui-sref="admin.invoices.show({id:invoice.id})">{{_('Visa')}}</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>


<div class="panel panel-default" ng-if="!clubs.club.invoices_outgoing.length">

    <div class="panel-heading">{{_('Utgående fakturor')}}</div>
    <div class="panel-body">
        {{_('Det finns inga fakturor att visa.')}}
        <hr>
        <button ui-sref="admin.clubs.invoices.index" class="btn btn-primary">{{_('Fakturaöversikt')}}</button>
    </div>
</div>