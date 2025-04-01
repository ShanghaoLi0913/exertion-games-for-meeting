export class FloatImage {
  constructor(id, src) {
    this.img = document.createElement('img');
    this.img.src = src;
    this.img.id = id;
    this.img.style.position = 'absolute';
    this.img.style.pointerEvents = 'none';
    this.img.style.zIndex = '999';
  }

  drawImg(x, y, width, height) {
    this.img.style.width = `${width}px`;
    this.img.style.height = `${height}px`;
    this.img.style.left = `${x - width / 2}px`;
    this.img.style.top = `${y - height / 2}px`;

    document.body.appendChild(this.img);
  }

  deleteImg() {
    const img = document.getElementById(this.img.id);
    if (img) {
      img.src = '';
      img.remove();
    }
  }
}
