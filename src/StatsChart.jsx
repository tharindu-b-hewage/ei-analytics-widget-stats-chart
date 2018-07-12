import React, {Component} from 'react';
import Widget from '@wso2-dashboards/widget';
import VizG from 'react-vizgrammar';
import moment from 'moment';

var PAGE_PROXY = 'proxy';
var PAGE_OVERVIEW = 'overview';
var PAGE_API = 'api';
var PAGE_SEQUENCE = 'sequence';
var TENANT_ID = '-1234';
var PAGE_ENDPOINT = 'endpoint';
var PAGE_INBOUND_ENDPOINT = 'inboundEndpoint';
var PAGE_MEDIATOR = 'mediator';
var PUBLISHER_DATE_TIME_PICKER = "granularity";
var PUBLISHER_SEARCH_BOX = "selectedComponent";

// console.log(JSON.stringify(this.bodyRef.current.parentNode.getAttribute("height")));

class StatsChart extends Widget {
    constructor(props) {
        super(props);
        this.state = {
            page: null,
            componentName: null,
            entryPoint: null, // todo: Find out what this is for
            timeFrom: null,
            timeTo: null,
            timeUnit: null,
            totalCount: null,
            faultCount: null
        };

        // this.graphSideLength = {width: 200, height: 200};

        this.extractStatsData = this.extractStats.bind(this);

        this.successChartConfig = {
            charts: [
                {
                    title: "Success",
                    type: "arc",
                    x: "torque",
                    color: "success",
                    colorScale: [
                        "#5CB85C",
                        "#353B48"
                    ]
                }
            ],
            percentage: true,
            width: 100,
            height: 100
        };

        this.faultChartConfig = {
            charts: [
                {
                    type: "arc",
                    x: "torque",
                    color: "success",
                    colorScale: [
                        "#D9534F",
                        "#353B48"
                    ]
                }
            ],
            percentage: true,
            width: 100,
            height: 100
        };

        this.metadata = {
            "names": ["rpm", "torque", "horsepower", "EngineType"],
            "types": ["linear", "linear", "ordinal", "ordinal"]
        };
    }

    // setGraphSideLength() {
    //     let style = this.domElementBody.current.parentElement.getAttribute('style');
    //     let styleAttributes = style.split(';');
    //     let dimensions = [];
    //     let width, height;
    //     styleAttributes.forEach((value) => {
    //         if (value.includes('width')) {
    //             width = parseInt(value.match(/\d+/)[0]);
    //         }
    //         else if (value.includes('height')) {
    //             height = parseInt(value.match(/\d+/)[0]);
    //         }
    //     });
    //     this.graphSideLength = {width: width, height: height};
    // }

    componentDidMount() {
        this.setState({page: this.getCurrentPage()}, this.handleParameterChange);

        let queryString = this.getQueryString();
        // If window url contains entryPoint, store it in the state
        if (queryString.entryPoint) {
            this.setState({
                entryPoint: queryString.entryPoint
            }, this.handleParameterChange);
        }
        //this.extractStatsData("ALL", "ALL", null, -1234, "ESBStat");
    }

    componentWillMount() {
        super.subscribe(this.handleRecievedMessage.bind(this));
    }

    handleParameterChange() {
        let pageName = this.state.page;
        if (this.state.timeFrom != null && this.state.timeTo != null && this.state.timeUnit != null) {
            if (pageName === PAGE_OVERVIEW) {
                /*
                componentType, componentName, entryPoint, tenantId, aggregator
                 */
                this.extractStatsData("ALL", "ALL", null, -1234, "ESBStat", this.state.timeFrom, this.state.timeTo, this.state.timeUnit);
            }
            else if (this.state.componentName != null) {
                switch (pageName) {
                    case PAGE_PROXY:
                        this.extractStatsData(PAGE_PROXY, this.state.componentName, null, TENANT_ID, "ESBStat",
                            this.state.timeFrom, this.state.timeTo, this.state.timeUnit);
                        break;
                    case PAGE_API:
                        this.extractStatsData(PAGE_API, this.state.componentName, null, TENANT_ID, "ESBStat",
                            this.state.timeFrom, this.state.timeTo, this.state.timeUnit);
                        break;
                    case PAGE_SEQUENCE:
                        this.state.entryPoint != null ? this.extractStatsData(PAGE_SEQUENCE, this.state.componentName,
                            this.state.entryPoint, TENANT_ID, "MediatorStat", this.state.timeFrom, this.state.timeTo, this.state.timeUnit) : null;
                        break;
                    case PAGE_ENDPOINT:
                        this.state.entryPoint != null ? this.extractStatsData(PAGE_ENDPOINT, this.state.componentName,
                            this.state.entryPoint, TENANT_ID, "MediatorStat", this.state.timeFrom, this.state.timeTo, this.state.timeUnit) : null;
                        break;
                    case PAGE_INBOUND_ENDPOINT:
                        this.extractStatsData(PAGE_INBOUND_ENDPOINT, this.state.componentName, null, TENANT_ID, "ESBStat",
                            this.state.timeFrom, this.state.timeTo, this.state.timeUnit);
                        break;
                    case PAGE_MEDIATOR:
                        this.state.entryPoint != null ? this.extractStatsData(PAGE_MEDIATOR, this.state.componentName,
                            this.state.entryPoint, TENANT_ID, "MediatorStat", this.state.timeFrom, this.state.timeTo, this.state.timeUnit) : null;
                        break;
                }
            }
        }
    }

    handleRecievedMessage(recievedMessage) {
        //console.log(JSON.stringify(recievedMessage));
        let message;
        if (typeof recievedMessage == "string") {
            message = JSON.parse(recievedMessage);
        }
        else {
            message = recievedMessage;
        }

        if (PUBLISHER_DATE_TIME_PICKER in message) {
            this.setState({
                timeFrom: moment(message.from).format("YYYY-MM-DD HH:mm:ss"),
                timeTo: moment(message.to).format("YYYY-MM-DD HH:mm:ss"),
                timeUnit: message.granularity + 's'
            }, this.handleParameterChange);
        }
        if (PUBLISHER_SEARCH_BOX in message) {
            this.setState({
                componentName: message.selectedComponent
            }, this.handleParameterChange);
        }
    }

    /**
     * Get message count details from the DB  and set the state accordingly
     */
    extractStats(componentType, componentName, entryPoint, tenantId, aggregator, timeFrom, timeTo, timeUnit) {
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
                        .replace("{{componentName}}", ((componentName === "ALL") ? 'true' : "\'" + componentName + "\'"))
                        .replace("{{tenantId}}", tenantId)
                        .replace("{{timeFrom}}", "\'" + timeFrom + "\'")
                        .replace("{{timeTo}}", "\'" + timeTo + "\'")
                        .replace("{{timeUnit}}", "\'" + timeUnit + "\'");
                    dataProviderConf.configs.providerConfig.configs.config.queryData.query = formattedQuery;
                    delete dataProviderConf.configs.providerConfig.configs.config.queryData.nullEntryPointStatPerQuery;
                    delete dataProviderConf.configs.providerConfig.configs.config.queryData.notNullEntryPointStatPerQuery;
                } else {
                    var query = dataProviderConf.configs.providerConfig.configs.config.queryData.notNullEntryPointStatPerQuery;
                    let formattedQuery = query
                        .replace("{{aggregator}}", aggregator)
                        .replace("{{entryPoint}}", "\'" + entryPoint + "\'")
                        .replace("{{componentIdentifier}}", (componentName == "ALL" ? 'true' : componentIdentifier))
                        .replace("{{componentName}}", ((componentName === "ALL") ? 'true' : "\'" + componentName + "\'"))
                        .replace("{{tenantId}}", tenantId)
                        .replace("{{timeFrom}}", "\'" + timeFrom + "\'")
                        .replace("{{timeTo}}", "\'" + timeTo + "\'")
                        .replace("{{timeUnit}}", "\'" + timeUnit + "\'");
                    dataProviderConf.configs.providerConfig.configs.config.queryData.query = formattedQuery;
                    delete dataProviderConf.configs.providerConfig.configs.config.queryData.nullEntryPointStatPerQuery;
                    delete dataProviderConf.configs.providerConfig.configs.config.queryData.notNullEntryPointStatPerQuery;
                }
                //console.log(JSON.stringify(dataProviderConf.configs.providerConfig));
                super.getWidgetChannelManager()
                    .subscribeWidget(this.props.id, this.handleStats().bind(this), dataProviderConf.configs.providerConfig);
            })
            .catch((error) => {
                // todo: Handle Rest API call failure
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
            //console.log("Received final stats: " + JSON.stringify(stats));
        }
    }

    getProviderConf(aggregatorDataProviderConf) {
        let stringifiedDataProvideConf = JSON.stringify(aggregatorDataProviderConf);
        return JSON.parse(stringifiedDataProvideConf);
    }

    getCurrentPage() {
        var pageName;
        var href = window.location.href;
        var lastSegment = href.substr(href.lastIndexOf('/') + 1);
        if (lastSegment.indexOf('?') == -1) {
            pageName = lastSegment;
        } else {
            pageName = lastSegment.substr(0, lastSegment.indexOf('?'));
        }
        return pageName;
    };

    getQueryString() {
        var queryStringKeyValue = window.location.search.replace('?', '').split('&');
        var qsJsonObject = {};
        if (queryStringKeyValue != '') {
            for (let i = 0; i < queryStringKeyValue.length; i++) {
                qsJsonObject[queryStringKeyValue[i].split('=')[0]] = queryStringKeyValue[i].split('=')[1];
            }
        }
        return qsJsonObject;
    };

    drawCharts() {
        return (
            <body>
            <div id={"overall-count"} style={{float: 'left', height: '100%', minHeight: '100%', width: '20%'}}>
                <h2><b>Total</b> requests</h2>
                <h4><span
                    id="title">{this.state.componentName != null ? 'for ' + this.state.componentName : null}</span></h4>
                <h1 id="totalCount">{this.state.totalCount}</h1>
            </div>
            <div id={"charts"} style={{float: 'left', height: '100%', minHeight: '100%', width: '80%'}}>
                <div style={{float: 'left', textAlign: 'center', height: '100%', minHeight: '100%', width: '50%'}}>
                    <div style={{float: 'bottom', height: '60%', width: '100%'}}>
                        <VizG config={this.successChartConfig} metadata={this.metadata} data={[[
                            9000, ((this.state.totalCount - this.state.faultCount) * 100) / this.state.totalCount, 130, "Rotary"]]}>
                        </VizG>
                    </div>
                    <div style={{float: 'top', height: '40%', width: '100%'}}>
                        <h5>Success Rate</h5>
                        <h6>{'Success Requests: ' + String(this.state.totalCount - this.state.faultCount)}</h6>
                    </div>
                </div>
                <div style={{float: 'left', textAlign: 'center', height: '100%', minHeight: '100%', width: '50%'}}>
                    <div style={{float: 'bottom', height: '60%', width: '100%'}}>
                        <VizG config={this.faultChartConfig} metadata={this.metadata} data={[[
                            9000, ((this.state.faultCount) * 100) / this.state.totalCount, 130, "Rotary"]]}/>
                    </div>
                    <div style={{float: 'top', height: '40%', width: '100%'}}>
                        <h5>Failure Rate</h5>
                        <h6>{'Failure Requests: ' + String(this.state.faultCount)}</h6>
                    </div>
                </div>
            </div>
            </body>
        )
    }

    isDataRecieved() {
        return this.state.totalCount != null && this.state.componentName != null;
    }

    noParameters() {
        var page = this.getCurrentPage();
        switch (page) {
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
            case 'inboundEndpoint':
                return 'Please select an Inbound Endpoint and a valid date range to view stats.';
                break;
            default:
                return 'Please select a valid date range to view stats';
        }
        ;
    }

    render() {
        return (
            this.isDataRecieved() ? this.drawCharts() : <h5>{this.noParameters()}</h5>
        )
    }
}

global.dashboard.registerWidget('StatsChart', StatsChart);