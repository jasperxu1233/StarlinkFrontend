import React, { Component } from "react";
import { Row, Col } from "antd";
import axios from "axios";
import { NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY } from "../constants";
import SatSetting from "./SatSetting";
import SatelliteList from "./SatelliteList";
import WorldMap from "./WorldMap";

class Main extends Component {
    constructor() {
        super();
        this.state = {
            satInfo: null,
            isLoadingList: false,
            satList : null,
            setting : null
        };
    }

    showNearbySatellite = (setting) => {  //得到用户输入的数据并且存储再setting
        this.setState({
            isLoadingList: true,  //设置loadingList的状态，等待satellite list拿到后台数据并且被加载出来
            setting: setting,  //讲填入的卫星参数写入setting
        });
        this.fetchSatellite(setting);
    };


    fetchSatellite = (setting) => {
        const {latitude, longitude, elevation, altitude} = setting; //解构填入的卫星参数
        const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;

        this.setState({
            isLoadingList: true
        })

        axios.get(url)
            .then(response => {
                console.log(response.data)
                this.setState({
                    satInfo: response.data, //将后台拿到的卫星数据存储到satInfo里面
                })
            })
            .catch(error => {
                console.log('err in fetch satellite -> ', error);

            })
            .finally(() => {
                this.setState({
                    isLoadingList: false
                })
            })
    }

    showMap = (selected) => {  //选中的卫星作存储到satList
        this.setState((preState) => ({
           ...preState,
           satList : [...selected],
        }))
    };

    render() {
        const { isLoadingList, satInfo, satList, setting } = this.state;
        return (
            <Row className="main">
                <Col span={8} className="left-side">
                    <SatSetting onShow={this.showNearbySatellite} />
                    <SatelliteList
                        isLoad={isLoadingList}  //传入isLoadingList作为书否将卫星显示出来的参数
                        satInfo={satInfo}       //后台得到的卫星数据 传入satInfo
                        onShowMap={this.showMap}
                    />
                </Col>
                <Col span={16} className="right-side">
                    <WorldMap satData={satList} observerData={setting} />
                </Col>
            </Row>
        );
    }
}

export default Main;