/*
 * @Author: your name
 * @Date: 2022-01-27 10:58:22
 * @LastEditTime: 2022-02-09 17:19:34
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: \branches\src\common\js\createInfoBox.js
 */

import {CSS3DRenderer, CSS3DObject, CSS3DSprite} from 'three/examples/jsm/renderers/CSS3DRenderer';
import {CSS2DRenderer, CSS2DObject} from 'three/examples/jsm/renderers/CSS2DRenderer';
// import {
//   CubicBezierCurve3,
//   CatmullRomCurve3,
//   BufferGeometry,
//   Mesh,
//   Float32BufferAttribute,
//   BufferAttribute,
//   TextureLoader,
//   RepeatWrapping,
//   AdditiveBlending,
//   FrontSide,
//   Vector3
// } from 'three';

export default class CreateInfoBox {
  constructor(scene, element, renderModel = 3) {
    this.renderModel = renderModel; // css的渲染的模式（2D 和 3D 模式）
    this.cssRenderer = undefined; // Renderer对象
    this.scene = scene; // Renderer对象
    this.cssRendererDomElement = undefined; // 信息框的dom对象
    // this.infoBoxLayer = new Group();// 信息框的三维物体组
    this.config = {};
    this.init(element); // 初始化
    this.dom = null;
    this.tmp = null;
  }
  init(element) {
    const cssRenderer = this.renderModel === 2 ? new CSS2DRenderer() : new CSS3DRenderer();
    cssRenderer.setSize(element.offsetWidth, element.offsetHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = 0;
    cssRenderer.domElement.style.pointerEvents = 'none';
    element.appendChild(cssRenderer.domElement);
    this.cssRenderer = cssRenderer;
    this.cssRendererDomElement = cssRenderer.domElement;
  }

  add(option) {
    let list = [];
    if (Array.isArray(option)) list = option;
    else list.push(option);
    list.forEach(e => {
      this.dom = document.createElement('div');
      this.tmp = document.createElement('div');
      this.tmp.innerHTML = e.element;
      this.dom = this.tmp.children[0];
      const label =
        this.renderModel === 2
          ? new CSS2DObject(this.dom)
          : this.renderModel === 3
          ? new CSS3DObject(this.dom)
          : new CSS3DSprite(this.dom);
      label.userData.isCss23D = true;
      label.position.set(e.position[0], e.position[1], e.position[2]);
      label.name = e.name;
      if (e.scale) label.scale.set(e.scale[0], e.scale[1], e.scale[2]);
      e.parent ? e.parent.add(label) : this.scene.add(label);
      this.config[e.name] = label;
      //再添加css3引导线
      // this.addGuideLine(e);
    });
  }
  update(name, innerHtml) {
    this.config[name].element.innerHTML = innerHtml;
  }
  remove(name, parent) {
    parent = parent || this.scene;
    parent.remove(parent.getObjectByName(name));
    if (this.config[name]) delete this.config[name];
  }
  search(name) {
    return this.config[name];
  }
  removeAll(parent) {
    //需要倒序遍历
    for (let i = parent.children.length - 1; i >= 0; i--) {
      const e = parent.children[i];
      if (e.userData.isCss23D) {
        const name = e.name;
        parent.remove(e);
        if (this.config[name]) delete this.config[name];
      }
    }
  }
}
