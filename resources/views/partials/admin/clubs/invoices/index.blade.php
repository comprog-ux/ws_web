<div class="row">
    <div class="col-sm-4">
        <div class="panel panel-default">
            <div class="panel-heading">Inkommande fakturor</div>
            <table class="table table-bordered">
                <body>
                    <tr>
                        <td>Antal</td>
                        <td class="text-right"><% clubs.club.invoices_incoming.length %></td>
                    </tr>
                    <tr>
                        <td>Summa</td>
                        <td class="text-right"><% clubs.club.invoices_incoming | sumByKey:'amount' %></td>
                    </tr>
                </body>
            </table>
            <div class="panel-body">
                <a ng-if="clubs.club.invoices_incoming.length" ui-sref="admin.clubs.show.invoices.incoming({id: clubs.club.id})" class="btn btn-default btn-block">{{_('Visa fakturor')}}</a>
            </div>
        </div>
    </div>
    <div class="col-sm-4">
        <div class="panel panel-default">
            <div class="panel-heading">Utgående fakturor</div>
            <table class="table table-bordered">
                <body>
                <tr>
                    <td>Antal</td>
                    <td class="text-right"><% clubs.club.invoices_outgoing.length %></td>
                </tr>
                <tr>
                    <td>Summa</td>
                    <td class="text-right"><% clubs.club.invoices_outgoing | sumByKey:'amount' %></td>
                </tr>
                </body>
            </table>
            <div class="panel-body">
                <a ng-if="clubs.club.invoices_outgoing.length" ui-sref="admin.clubs.show.invoices.outgoing({id:clubs.club.id})" class="btn btn-default btn-block">{{_('Visa fakturor')}}</a>
            </div>
        </div>
    </div>
</div>
