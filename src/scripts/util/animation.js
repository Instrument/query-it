import $ from 'jquery';

module.exports = {
  fadeInText ($el, timing=150) {
    const str = $el.text();
    const arr = str.split(/([\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDBFF\uDC00-\uDFFF])/);
    const addVisible = char => char.addClass('visible');

    $el.text('').addClass('is-visible');
    arr.forEach((item, k) => {
      const temp = $('<span class="animate__text-char">'+ item + '</span>');
      const last = arr.length;
      $el.append(temp);

      setTimeout(() => {
        addVisible(temp);
        if (k === (last - 1)) {
          $(document).trigger('animationDone');
        }
      }, k * timing);
    });

  }
};
