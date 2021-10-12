import React, {Component} from 'react';
import { Row, Col } from 'antd';
import SatSetting from './SatSetting';


class Main extends Component {
    render() {
        return (   //进行左右分隔，比例8 ： 16
            <Row className='main'>
                <Col span={8} className="left-side">
                    <SatSetting />
                </Col>
                <Col span={16} className="right-side">
                    right
                </Col>
            </Row>
        );
    }
}

export default Main;