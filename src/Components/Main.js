import React, {Component} from 'react';
import { Row, Col } from 'antd';
import SatSetting from './SatSetting';
import SatelliteList from './SatelliteList';
import axios from "axios";
import {NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY} from "../constants";

class Main extends Component {
    state = {
        satInfo : null,
        settings : null,
        isLoadingList: false
    }


    showNearbySatellite = (setting) => {
        this.setState({
            settings: setting
        })
        this.fetchSatellite(setting);
    }

    fetchSatellite = (setting) => {
        const {latitude, longitude, elevation, altitude} = setting;
        const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;

        this.setState({
            isLoadingList: true
        })

        axios.get(url)
            .then(response => {
                console.log(response.data)
                this.setState({
                    satInfo: response.data,
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

    render() {
        return (
            <Row className='main'>
                <Col span={10} className="left-side">
                    <SatSetting onShow={this.showNearbySatellite}/>
                    <SatelliteList
                        satInfo={this.state.satInfo}
                        isLoad={this.state.isLoadingList}
                    />
                </Col>
                <Col span={14} className="right-side">
                    right
                </Col>
            </Row>
        );
    }
}

export default Main;
