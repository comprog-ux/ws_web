<div class="panel panel-default" ng-if="invoices.invoices_incoming.length">
    <div class="panel-heading">{{_('Inkommande Fakturor')}}</div>

    <div class="table-responsive">
        <table class="table table-hover table-bordered">
            <thead>
                <tr>
                    <th>{{_('Datum')}}</th>
                    <th>{{_('Fakturnr')}}</th>
                    <th>{{_('Avsändare')}}</th>
                    <th>{{_('Status')}}</th>
                    <th class="text-right">{{_('Antal anmälningar')}}</th>
                    <th class="text-right">{{_('Summa')}}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr ng-repeat="invoice in invoices.invoices_incoming">
                    <td ui-sref="invoices.show({id:invoice.id})"><% invoice.invoice_date %></td>
                    <td ui-sref="invoices.show({id:invoice.id})"><% invoice.invoice_reference %></td>
                    <td ui-sref="invoices.show({id:invoice.id})"><% invoice.sender_name %></td>
                    <td ui-sref="invoices.show({id:invoice.id})" class="nowrap"><% invoice.payment_status %></td>
                    <td ui-sref="invoices.show({id:invoice.id})" class="text-right"><% invoice.signups_count %></td>
                    <td ui-sref="invoices.show({id:invoice.id})" class="text-right"><% invoice.amount %></td>
                    <td class="text-right">
                        <button ng-click="invoices.download(invoice);" class="btn btn-xs btn-default"><i class="fa fa-download"></i> Ladda ner</button>
                        <button class="btn btn-xs btn-default" ui-sref="invoices.show({id:invoice.id})">{{_('Visa')}}</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<div class="panel panel-default" ng-if="!invoices.invoices_incoming.length">

    <div class="panel-heading">{{_('Inkommande fakturor')}}</div>
    <div class="panel-body">
        {{_('Det finns inga fakturor att visa.')}}
        <hr>
        <button ui-sref="invoices.index" class="btn btn-primary">{{_('Fakturaöversikt')}}</button>
    </div>
</div>