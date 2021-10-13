import React, {Component} from 'react';
import {Avatar, Button, Checkbox, List, Spin} from 'antd';
import satellite from "../assets/images/spacex_logo.svg";

class SatelliteList extends Component {
    render() {
        const satList = this.props.satInfo ? this.props.satInfo.above : [];
        const { isLoad } = this.props;  //解构拿到isLoad的数据。

        return (
            <div className="sat-list-box">
                <Button className="sat-list-btn"
                        size="large">Track on the map</Button>
                <hr/>
                {
                    isLoad ? //通过isLoad状态得到展示前一个还是后一个标签的目的
                        <div className="spin-box">
                            <Spin tip="Loading..." size="large" />
                        </div>
                        :
                    <List
                        className="sat-list"
                        itemLayout="horizontal"
                        size="small"
                        dataSource={satList}
                        renderItem={item => (  //展示出所有卫星的信息
                            <List.Item
                                actions={[<Checkbox dataInfo={item} onChange={this.onChange}/>]}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar size={50} src={satellite} />}
                                    title={<p>{item.satname}</p>}
                                    description={`Launch Date: ${item.launchDate}`}
                                />

                            </List.Item>
                        )}
                    />

                }
            </div>
        );
    }
}

export default SatelliteList;
