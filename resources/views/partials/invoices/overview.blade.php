<div class="row">
    <div class="col-sm-4" ng-if="invoices.invoices_generate.length">
        <div class="panel panel-primary">
            <div class="panel-heading">Generera fakturor</div>
            <table class="table table-bordered">
                <body>
                <tr>
                    <td>Antal</td>
                    <td class="text-right"><% invoices.invoices_generate.length %></td>
                </tr>
                <tr>
                    <td>Summa</td>
                    <td class="text-right"><% invoices.invoices_generate | sumByKey:'registration_fee' %></td>
                </tr>
                </body>
            </table>
            <div class="panel-body">
                <button ui-sref="invoices.generate" class="btn btn-default btn-block">{{_('Visa anmälningar')}}</button>
            </div>
        </div>
    </div>
    <div class="col-sm-4" ng-if="invoices.invoices_incoming.length">
        <div class="panel panel-default">
            <div class="panel-heading">Inkommande fakturor</div>
            <table class="table table-bordered">
                <body>
                    <tr>
                        <td>Antal</td>
                        <td class="text-right"><% invoices.invoices_incoming.length %></td>
                    </tr>
                    <tr>
                        <td>Summa</td>
                        <td class="text-right"><% invoices.invoices_incoming | sumByKey:'amount' %></td>
                    </tr>
                </body>
            </table>
            <div class="panel-body">
                <button ui-sref="invoices.incoming" class="btn btn-default btn-block">{{_('Visa fakturor')}}</button>
            </div>
        </div>
    </div>
    <div class="col-sm-4" ng-if="invoices.invoices_outgoing.length">
        <div class="panel panel-default">
            <div class="panel-heading">Utgående fakturor</div>
            <table class="table table-bordered">
                <body>
                <tr>
                    <td>Antal</td>
                    <td class="text-right"><% invoices.invoices_outgoing.length %></td>
                </tr>
                <tr>
                    <td>Summa</td>
                    <td class="text-right"><% invoices.invoices_outgoing | sumByKey:'amount' %></td>
                </tr>
                </body>
            </table>
            <div class="panel-body">
                <button ui-sref="invoices.outgoing" class="btn btn-default btn-block">{{_('Visa fakturor')}}</button>
            </div>
        </div>
    </div>
</div>
