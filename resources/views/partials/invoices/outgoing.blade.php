<div class="panel panel-default" ng-if="invoices.invoices_outgoing.length">
    <div class="panel-heading">{{_('Utgående Fakturor')}}</div>

    <div class="table-responsive">
        <table class="table table-hover table-bordered">
            <thead>
                <tr>
                    <th>{{_('Datum')}}</th>
                    <th>{{_('Fakturnr')}}</th>
                    <th>{{_('Mottagare')}}</th>
                    <th>{{_('Status')}}</th>
                    <th>{{_('Betaldatum')}}</th>
                    <th class="text-right">{{_('Antal anmälningar')}}</th>
                    <th class="text-right">{{_('Summa')}}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr ng-repeat="invoice in invoices.invoices_outgoing">
                    <td ui-sref="invoices.show({id:invoice.id})"><% invoice.invoice_date %></td>
                    <td ui-sref="invoices.show({id:invoice.id})"><% invoice.invoice_reference %></td>
                    <td ui-sref="invoices.show({id:invoice.id})"><% invoice.recipient_name %></td>
                    <td class="nowrap"><% invoice.payment_status %></td>
                    <td>
                        <span ng-if="invoice.paid_at"><% invoice.paid_at | dateToISO | date:"yyyy-MM-dd" %></span>
                        <button class="btn btn-xs btn-primary" ng-if="!invoice.paid_at" ng-click="invoices.openPaymentModal(invoice)">{{_('Registrera')}}</button>
                    </td>
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


<script type="text/ng-template" id="ClubInvoicePaymentModal.html">
    <div class="modal-header">
        <h3 class="modal-title">{{_('Registrera betalning')}}</h3>
    </div>

    <div class="modal-body">

        <div class="row">
            <div class="col-sm-6">
                <label>{{_('Fakturnr')}}</label><br>
            </div>
            <div class="col-sm-6 text-right">
                <% modalcontroller.invoice.invoice_reference %>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-6">
                <label>{{_('Datum')}}</label><br>
            </div>
            <div class="col-sm-6 text-right">
                <% modalcontroller.invoice.invoice_date %>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-6">
                <label>{{_('Summa')}}</label><br>
            </div>
            <div class="col-sm-6 text-right">
                <% modalcontroller.invoice.amount %>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-6">
                <label>{{_('Status')}}</label><br>
            </div>
            <div class="col-sm-6 text-right">
                <% modalcontroller.invoice.payment_status %>
            </div>
        </div>

        <hr>
        <div class="row">
            <div class="col-sm-12">
                <label>{{_('Betaldatum')}}</label>
                <div uib-datepicker ng-model="modalcontroller.invoice.paid_at" class="well well-sm" datepicker-options="modalcontroller.options"></div>
            </div>
        </div>



    </div>
    <div class="modal-footer">
        <div class="row">
            <div class="col-sm-6 text-left">
                <button class="btn btn-default" type="button" ng-click="modalcontroller.cancel()">Cancel</button>
            </div>
            <div class="col-sm-6 text-right">
                <button class="btn btn-primary" type="button" ng-click="modalcontroller.registerPayment(modalcontroller.invoice)">{{_('Registrera betalning')}}</button>

            </div>
        </div>
    </div>
</script>

<div class="panel panel-default" ng-if="!invoices.invoices_outgoing.length">

    <div class="panel-heading">{{_('Utgående fakturor')}}</div>
    <div class="panel-body">
        {{_('Det finns inga fakturor att visa.')}}
        <hr>
        <button ui-sref="invoices.index" class="btn btn-primary">{{_('Fakturaöversikt')}}</button>
    </div>
</div>