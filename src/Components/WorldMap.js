import React, { Component } from "react";
import axios from "axios";
import { Spin } from "antd";
import { feature } from "topojson-client";
import { geoKavrayskiy7 } from "d3-geo-projection";
import { geoGraticule, geoPath } from "d3-geo";
import { select as d3Select } from "d3-selection";
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";

import {
    WORLD_MAP_URL,
    SATELLITE_POSITION_URL,
    SAT_API_KEY,
} from "../constants";

const width = 960;
const height = 600;

class WorldMap extends Component {

    constructor(){
        super();
        this.state = {
            isLoading: false,
            isDrawing: false,
        };

        this.refMap = React.createRef(); //ref用来拿到页面上元的ref，因为canvas要getelemetbyid
        this.map = null;
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
        this.refTrack = React.createRef();
    }

    componentDidMount() {           //获取地图的元素
        axios.get(WORLD_MAP_URL)
            .then(res => {
                const { data } = res;  //拆数据
                const land = feature(data, data.objects.countries).features;  //利用topjson解析世界地图数据
                this.generateMap(land);//将land丢给负责画图的方法
            })
            .catch(e => console.log('err in fecth world map data ', e))
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.satData !== this.props.satData) {
            const { latitude, longitude, elevation, duration } =
                this.props.observerData;
            const endTime = duration * 60;

            this.setState({
                isLoading: true,
            });

            const urls = this.props.satData.map((sat) => {
                const { satid } = sat;
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;

                return axios.get(url);
            });

            Promise.all(urls)
                .then((res) => {
                    const arr = res.map((sat) => sat.data);
                    this.setState({
                        isLoading: false,
                        isDrawing: true,
                    });

                    if (!prevState.isDrawing) {
                        this.track(arr);
                    } else {
                        const oHint = document.getElementsByClassName("hint")[0];
                        oHint.innerHTML =
                            "Please wait for these satellite animation to finish before selection new ones!";
                    }
                })
                .catch((e) => {
                    console.log("err in fetch satellite position -> ", e.message);
                });
        }
    }

    track = (data) => {
        if (!data[0].hasOwnProperty("positions")) {
            throw new Error("no position data");
        }

        const len = data[0].positions.length;
        const { context2 } = this.map;

        let now = new Date();

        let i = 0;

        let timer = setInterval(() => { //每隔多少秒
            let ct = new Date();

            let timePassed = i === 0 ? 0 : ct - now;
            let time = new Date(now.getTime() + 60 * timePassed);

            context2.clearRect(0, 0, width, height);

            context2.font = "bold 14px sans-serif";
            context2.fillStyle = "#333";
            context2.textAlign = "center";
            context2.fillText(d3TimeFormat(time), width / 2, 10);

            if (i >= len) {
                clearInterval(timer);
                this.setState({ isDrawing: false });
                const oHint = document.getElementsByClassName("hint")[0];
                oHint.innerHTML = "";
                return;
            }

            data.forEach((sat) => {
                const { info, positions } = sat;
                this.drawSat(info, positions[i]);
            });

            i += 60;
        }, 1000);
    };

    drawSat = (sat, pos) => {
        const { satlongitude, satlatitude } = pos;

        if (!satlongitude || !satlatitude) return;

        const { satname } = sat;
        const nameWithNumber = satname.match(/\d+/g).join("");

        const { projection, context2 } = this.map;
        const xy = projection([satlongitude, satlatitude]);

        context2.fillStyle = this.color(nameWithNumber);
        context2.beginPath();
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
        context2.fill();

        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14);
    };


    generateMap = (land) => {
        const projection = geoKavrayskiy7() //标准世界地图展现方式
            .scale(170)                         //调配，类似于大小
            .translate([width / 2, height / 2]) //宽高比
            .precision(.1);                  //精度

        const graticule = geoGraticule();  //经纬线网格

        const canvas = d3Select(this.refMap.current) //元素的ref传给d3 , 调整画布的属性
            .attr("width", width)
            .attr("height", height);

        const canvas2 = d3Select(this.refTrack.current)
            .attr("width", width)
            .attr("height", height);


        let context = canvas.node().getContext("2d"); //2d的
        const context2 = canvas2.node().getContext("2d");

        let path = geoPath()         //路径的变量
            .projection(projection)
            .context(context);

        land.forEach(ele => {
            context.fillStyle = '#B3DDEF';  //填充色颜色
            context.strokeStyle = '#000';   //线条颜色
            context.globalAlpha = 0.7;     //线的比例
            context.beginPath();         //开始作画
            path(ele);               //笔能读懂的数据
            context.fill();              //填颜色
            context.stroke();      //画线

            context.strokeStyle = 'rgba(220, 220, 220, 0.1)';    //颜色
            context.beginPath();
            path(graticule());             //画经纬度
            context.lineWidth = 0.1;
            context.stroke();

            context.beginPath();
            context.lineWidth = 0.5;       //画最外圈的线，d3最外圈的线是不画的
            path(graticule.outline());
            context.stroke();
        })


        this.map = {
            context : context,
            context2 : context2,
            projection :projection,
            graticule : graticule
        }
    }


    render() {
        const { isLoading } = this.state;
        return (
            <div className="map-box">
                {isLoading ? (
                    <div className="spinner">
                        <Spin tip="Loading..." size="large" />
                    </div>
                ) : null}
                <canvas className="map" ref={this.refMap} />
                <canvas className="track" ref={this.refTrack} />
                <div className="hint" />
            </div>
        );
    }
}

export default WorldMap;