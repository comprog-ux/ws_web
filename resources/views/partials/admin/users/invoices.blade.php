<div class="panel panel-default">
    <div class="panel-heading">
        {{_('Fakturor')}}
    </div>

    <div class="row hide" ng-class="{'show': user.user.invoices_incoming.length}">
        <div class="col-sm-12">
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
                <tr ng-repeat="invoice in user.user.invoices_incoming">
                    <td ui-sref="admin.invoices.show({id:invoice.id})"><% invoice.invoice_date %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})"><% invoice.invoice_reference %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})"><% invoice.sender_name %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})" class="nowrap"><% invoice.payment_status %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})" class="text-right"><% invoice.signups_count %></td>
                    <td ui-sref="admin.invoices.show({id:invoice.id})" class="text-right"><% invoice.amount %></td>
                    <td class="text-right">
                        <button ng-click="user.downloadInvoice(invoice);" class="btn btn-xs btn-default"><i class="fa fa-download"></i> Ladda ner</button>
                        <button class="btn btn-xs btn-default" ui-sref="admin.invoices.show({id:invoice.id})">{{_('Visa')}}</button>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>