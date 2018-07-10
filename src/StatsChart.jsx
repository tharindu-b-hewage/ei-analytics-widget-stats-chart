import React, {Component} from 'react';
import Widget from '@wso2-dashboards/widget';

class StatsChart extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            page: null,
            componentName: null,
            entryPoint: null, // todo: Find out what this is for
            timeFrom: "2018-01-01 02:02:02",
            timeTo: "2019-01-01 02:02:02",
            timeUnit: "seconds",
            totalCount: 0,
            faultCount: 0
        };
        this.extractStatsData = this.extractStats.bind(this);
    }

    componentDidMount() {

        // Set page name
        // this.setState({
        //     page: this.getCurrentPage()
        // });
        
        this.extractStatsData("ALL", "ALL", null, -1234, "ESBStat");
    }
    componentDidMount() {

        // Set page name
        // this.setState({
        //     page: this.getCurrentPage()
        // });
        
        this.extractStatsData("ALL", "ALL", null, -1234, "ESBStat");
    }

    /**
     * Get message count details from the DB  and set the state accordingly
     */
    extractStats(componentType, componentName, entryPoint, tenantId, aggregator) {
        if (componentType == "Mediator" || componentType == "ALL") {
            var componentIdentifier = "componentId";
        } else {
            var componentIdentifier = "componentName";
        }
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                let dataProviderConf = this.getProviderConf(message.data);
                if (entryPoint == 'undefined' || entryPoint === null) {
                    var query = dataProviderConf.configs.providerConfig.configs.config.queryData.nullEntryPointStatPerQuery;

                    let formattedQuery = query
                        .replace("{{aggregator}}", aggregator)
                        .replace("{{componentIdentifier}}", (componentName == "ALL" ? 'true' : componentIdentifier))
                        .replace("{{componentName}}", ((componentName === "ALL") ? 'true' : "\'" + componentName+ "\'") )
                        .replace("{{tenantId}}", tenantId)
                        .replace("{{timeFrom}}", "\'" + this.state.timeFrom + "\'")
                        .replace("{{timeTo}}", "\'" + this.state.timeTo + "\'")
                        .replace("{{timeUnit}}", "\'" + this.state.timeUnit + "\'");
                    dataProviderConf.configs.providerConfig.configs.config.queryData.query = formattedQuery;
                    delete dataProviderConf.configs.providerConfig.configs.config.queryData.nullEntryPointStatPerQuery;
                    delete dataProviderConf.configs.providerConfig.configs.config.queryData.notNullEntryPointStatPerQuery;
                } else {
                    var query = dataProviderConf.configs.providerConfig.configs.config.queryData.notNullEntryPointStatPerQuery;
                    let formattedQuery = query
                        .replace("{{aggregator}}", aggregator)
                        .replace("{{entryPoint}}", entryPoint)
                        .replace("{{componentIdentifier}}", (componentName == "ALL" ? 'true' : componentIdentifier))
                        .replace("{{componentName}}", ((componentName === "ALL") ? 'true' : "\'" + componentName+ "\'") )
                        .replace("{{tenantId}}", tenantId)
                        .replace("{{timeFrom}}", "\'" + this.state.timeFrom + "\'")
                        .replace("{{timeTo}}", "\'" + this.state.timeTo + "\'")
                        .replace("{{timeUnit}}", "\'" + this.state.timeUnit + "\'");
                    dataProviderConf.configs.providerConfig.configs.config.queryData.query = formattedQuery;
                    delete dataProviderConf.configs.providerConfig.configs.config.queryData.nullEntryPointStatPerQuery;
                    delete dataProviderConf.configs.providerConfig.configs.config.queryData.notNullEntryPointStatPerQuery;
                }
                console.log(JSON.stringify(dataProviderConf.configs.providerConfig));
                super.getWidgetChannelManager()
                    .subscribeWidget(this.props.id, this.handleStats().bind(this), dataProviderConf.configs.providerConfig);
            })
            .catch((error) => {
                // Handle Rest API call failure
            });
    }

    /**
     * Process received data and store meaningful values
     *
     * @returns {Function}
     */
    handleStats() {
        return function (stats) {
            let metadata = stats.metadata.names;
            let data = stats.data[0];
            let dataIndex = {};
            metadata.forEach((value, index) => {
                dataIndex[value] = index;
            })

            this.setState({
                totalCount: data[dataIndex["noOfInvocationSum"]],
                faultCount: data[dataIndex["faultCountSum"]]
            });
            console.log("Received final stats: " + JSON.stringify(stats));
        }
    }

    getProviderConf(aggregatorDataProviderConf) {
        let stringifiedDataProvideConf = JSON.stringify(aggregatorDataProviderConf);
        return JSON.parse(stringifiedDataProvideConf);
    }

    /**
     * Display info message if date time or a component is not selected
     */
    checkParameterValidity() {
        if (this.state.page && this.state.componentName && this.state.timeTo && this.state.timeFrom == null) {
            switch (this.state.page.name) {
                case 'api':
                    return 'Please select an API and a valid date range to view stats.';
                    break;
                case 'proxy':
                    return 'Please select a Proxy Service and a valid date range to view stats.';
                    break;
                case 'sequences':
                    return 'Please select a Sequence and a valid date range to view stats.';
                    break;
                case 'endpoint':
                    return 'Please select an Endpoint and a valid date range to view stats.';
                    break;
                case 'inbound':
                    return 'Please select an Inbound Endpoint and a valid date range to view stats.';
                    break;
                default:
                    return 'Please select valid date range to view stats.';
            }
        }
        return null;
    }

    getCurrentPage() {
        // var page, pageName;
        // var href = parent.window.location.href;
        // var lastSegment = href.substr(href.lastIndexOf('/') + 1);
        // if (lastSegment.indexOf('?') == -1) {
        //     pageName = lastSegment;
        // } else {
        //     pageName = lastSegment.substr(0, lastSegment.indexOf('?'));
        // }
        // return this.getGadgetConfig(pageName);
    };

    render() {
        return (
            <body>
            <div id={"canvas"}> {'Total Count = ' + this.state.totalCount + ' and Fault Count = ' + this.state.faultCount} </div>
            </body>
        );
    }
}

global.dashboard.registerWidget('StatsChart', StatsChart);