require('script-loader!../../node_modules/jquery')
require('script-loader!../../node_modules/bootstrap-sass')
require('script-loader!../../node_modules/bootstrap-datepicker')
require('script-loader!../../node_modules/bootstrap-datepicker/js/locales/bootstrap-datepicker.pt-BR')
require('script-loader!../../node_modules/jquery-mask-plugin/dist/jquery.mask.js')
require('./sass/app.scss')

jQuery(document).ready(function($) {
	$('.date').datepicker({
		format: "dd/mm/yyyy",
		weekStart: 0,
		todayBtn: true,
		language: "pt-BR",
		orientation: "bottom auto",
		todayHighlight: true
	});
	$('.date input').mask('00/00/0000');
});