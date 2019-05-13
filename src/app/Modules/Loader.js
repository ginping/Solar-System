// 异步模块定义规范(AMD)：https://github.com/amdjs/amdjs-api/wiki/AMD-(%E4%B8%AD%E6%96%87%E7%89%88)

define(
[
  'vendor/httprequest/httprequest',
  'Factory/SolarSystemFactory',
],
function(
  HttpRequest,
  SolarSystemFactory,
) {
  'use strict';

  var solarSystemData = null;
  var dataRequest = new HttpRequest(
    'GET',
    'src/data/solarsystem.json',
    true
  );

  dataRequest.send().then((data)=> {
    solarSystemData = data;

    var solarSystemFactory = new SolarSystemFactory(solarSystemData);
    var introScreen = $('.intro-screen');
    var renderButton = $('#render-scene');
    var solarsystem = $('#solar-system');
    var progressPrompt = $('#loading-prompt');

    solarsystem.fadeOut();

    renderButton.one('click', ()=> {
      $('.inner').slideUp(500, ()=> {
        progressPrompt.addClass('active');

        solarSystemFactory.build(solarSystemData).then(()=> {
          introScreen.fadeOut(2000, ()=> {
            introScreen.remove();
            solarsystem.fadeIn(2000, ()=> {
            });
          });
        });
      });
    });
  });
});
