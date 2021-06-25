<div class="row">
    <div class="col-sm-4">
        <div class="panel panel-primary">
            <div class="panel-heading">Generera fakturor</div>
            <div class="panel-body" ng-if="invoices.invoices_generate.length">
                <p>{{_('Du har möjlighet att skapa en eller flera fakturor för lag eller anmälningar som är kopplade till din förening.')}}</p>
                <button ui-sref="club.invoices.generate" class="btn btn-default btn-block">{{_('Visa anmälningar')}}</button>
            </div>
            <div class="panel-body">
                <p>{{_('Det finns inga fakturor att generera')}}</p>
            </div>
        </div>
    </div>
    <div class="col-sm-4">
        <div class="panel panel-default">
            <div class="panel-heading">Inkommande fakturor</div>
            <table class="table table-bordered">
                <body>
                    <tr>
                        <td>Antal</td>
                        <td class="text-right"><% invoices.invoices.InvoicesIncoming %></td>
                    </tr>
                </body>
            </table>
            <div class="panel-body">
                <button ui-sref="club.invoices.incoming" class="btn btn-default btn-block">{{_('Visa fakturor')}}</button>
            </div>
        </div>
    </div>
    <div class="col-sm-4">
        <div class="panel panel-default">
            <div class="panel-heading">Skickade fakturor</div>
            <table class="table table-bordered">
                <body>
                <tr>
                    <td>Antal</td>
                    <td class="text-right"><% invoices.invoices.InvoicesOutgoing %></td>
                </tr>
                </body>
            </table>
            <div class="panel-body">
                <button ui-sref="club.invoices.outgoing" class="btn btn-default btn-block">{{_('Visa fakturor')}}</button>
            </div>
        </div>
    </div>
</div>
