<div class="row">
    <div class="col-sm-12">
        <div class="panel panel-primary">
            <div class="panel-heading hidden-print">
                {{_('Fakturor')}}
            </div>
            <div class="panel-body">

                <div class="row">
                    <div class="col-sm-3 hidden-print">
                        <ul class="nav nav-pills nav-stacked">

                            <li ng-class="{'active': (currentRoute == 'invoices.index')}">
                                <a ui-sref="invoices.index">
                                    {{_('Fakturaöversikt')}}
                                </a>
                            </li>
                            <li class="padding-left-15" ng-class="{'active': (currentRoute == 'invoices.incoming')}">
                                <a ui-sref="invoices.incoming">
                                    {{_('Inkommande Fakturor')}}
                                </a>
                            </li>
                            <li class="padding-left-15" ng-class="{'active': (currentRoute == 'invoices.outgoing')}">
                                <a ui-sref="invoices.outgoing">
                                    {{_('Utgående Fakturor')}}
                                </a>
                            </li>
                            <li class="padding-left-15" ng-class="{'active': (currentRoute == 'invoices.generate')}">
                                <a ui-sref="invoices.generate">
                                    {{_('Generera Fakturor')}}
                                </a>
                            </li>

                        </ul>
                    </div>
                    <div class="col-sm-9">
                        <div ui-view="main"></div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</div>
