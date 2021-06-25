<div class="row">
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
                <button ui-sref="districts.show.invoices.incoming({districts_id: district.district.id})" class="btn btn-default btn-block">{{_('Visa fakturor')}}</button>
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
                <button ui-sref="districts.show.invoices.outgoing({districts_id: district.district.id})" class="btn btn-default btn-block">{{_('Visa fakturor')}}</button>
            </div>
        </div>
    </div>
</div>
