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
	$(".panel-checkall").change(function(event) {
		const target = this.getAttribute('data-target');
		const checked = this.checked;
		const checkboxes = document.getElementsByName(target);
		const n = checkboxes.length;
		for(var i = 0 ; i < n ; i++) {
			checkboxes[i].checked = checked;
		}
	});
	Dropzone.autoDiscover = false;
	if(document.getElementById("drop")) {
		var dropzone_hndlr = new Dropzone(document.getElementById("drop"),
			{ 
				url: "/learning-object/upload-file",
				params: {"_id" : $("#_id").val()},
				maxFilesize: 1,
				paramName: 'file',
				createImageThumbnails: true,
				maxFiles: 1,
				addRemoveLinks:  true,
				maxFilesize: 20,
				thumbnailWidth: 100,
				clickable: true,
				acceptedFiles: ".pdf,.gif,.jpeg,.png,.txt,.rar,.zip,.mp4,.mp3,.flac,.wma,.mpeg4,.flv,.odt,.doc,.docx,.html,.midi.",
				dictDefaultMessage: "Arraste e solte arquivos aqui, ou clique nesta área para selecionar do computador",
				dictFallbackMessage: "Seu navegador não suporta o envio de arquivos",
				dictCancelUpload: "Cancelar envio.",
				dictRemoveFile: "Remover arquivo",
				dictInvalidFileType: "Tipo de arquivo inválido!",
				dictFileTooBig: "Arquivo muito grande! Você pode enviar arquivos de até {{maxFilesize}} MB",
				init: function(){
					var file = $("#file-json").data('file');
					console.log(file);
					var mockFile = { name: file.name, size: file.size, type: file.mimetype };
				   this.options.addedfile.call(this, mockFile);
				   this.options.thumbnail.call(this, mockFile, file.url);
				   mockFile.previewElement.classList.add('dz-success');
				   mockFile.previewElement.classList.add('dz-complete');
				}
			}
		);	
		dropzone_hndlr.on("removedfile", function(file) {
			$.post(
				'/learning-object/remove-file',
				{
					_id: $("#_id").val(),
					filename: file.name
				}, function(data, textStatus, xhr) {
					if (xhr.status == 200) {
						alert("Arquivo removido com sucesso!");
					}
				}
			);		
		});
		dropzone_hndlr.on("success", function(file, data) {
			alert("Arquivo adicionado com sucesso!");
		});
		dropzone_hndlr.on("addedfile", function(file, data) {		
			if (this.files[1] != null){
				alert("Você pode enviar apenas um arquivo!")
	        	this.removeFile(this.files[1]);        	
	        }	
		});	
		
		/*if ($("#file_name").val() != '') {					
			var file_info = JSON.parse($("#file_name").val());			
			file_info.dataURL = file_info.url			
			if (file_info) {
				var mockFile = { name: file_info.name, mimetype: file_info.mimetype, size: file_info.size, dataURL: file_info.url, url: file_info.url};
			    dropzone_hndlr.files.push(mockFile);
			    dropzone_hndlr.emit('addedfile', mockFile);
			    dropzone_hndlr.createThumbnailFromUrl(mockFile,
				    dropzone_hndlr.options.thumbnailWidth, dropzone_hndlr.options.thumbnailHeight,
				    dropzone_hndlr.options.thumbnailMethod, true, function (thumbnail) {
				           dropzone_hndlr.emit('thumbnail', mockFile, thumbnail);
				    },
				'anonymous');
			    dropzone_hndlr.emit('complete', mockFile);
			    dropzone_hndlr._updateMaxFilesReachedClass();
			    dropzone_hndlr.options.maxFiles = dropzone_hndlr.options.maxFiles - 1;
			}
		}*/
	}	
	
	var checked_lo_attributes = [];
	$(".checked-string, .panel-checkall").change(function(){
		checked_lo_attributes.splice(0, checked_lo_attributes.length);
		$(".checked-string").each(function(index, element){
			if (element.checked) {
				var text = $(element).next().text();
				checked_lo_attributes.push(text);
			}
		})		
		var seleted_string = checked_lo_attributes.join();		
		$("#checked-string").val(seleted_string.replace(/\,/g, ', '));
	});
	$(".js-other").change(function(event) {
        var parent = $(this).parent().parent();        
        if($(this).val().trim().length > 0) {
        	parent.find("[type=radio]:checked, [type=checkbox]:checked").prop('checked', false);
            parent.find("[type=radio]:checked, [type=checkbox]:checked").removeAttr('checked');            
        }
    });
    $("[type=radio]:not(:checked),[type=checkbox]:not(:checked)").change(function(event) {
        $(this).parents().eq(3).find(".js-other").val(null);
    });
    $('[href="#irbusca"]').click(function(){
    	$("#irbusca").focus()
    	document.getElementById("irbusca").focus();
    })
    /*var inputErrors = document.getElementById('input-errors');
    if(inputErrors) {
    	var jsonErrors = JSON.parse(inputErrors.textContent);    	
    	console.log(jsonErrors);
    	for (var inputName in jsonErrors.errors) {
    		var aux = null;
    		    	    		
    		var input = document.getElementsByName(inputName)[0];
    		if (input) {
    			input.insertAdjacentHTML('afterend', '<div role="alert" class="alert alert-danger">'+jsonErrors.errors[inputName].message+'</div>');
    		}
    		console.log(input)
    	}
    }*/
    var messages = document.getElementById('messages');
    if (messages) {    	
    	messages.focus();
    }
    $("#contrast").click(function(event){
    	event.preventDefault();
    	$("body").toggleClass("contrast");
    })
    $(".remove").click(function(event){
    	event.preventDefault();
    	if (confirm("Você tem certeza?")) {
    		window.location = this.href
    	}
    })
    $(".table-checkall").change(function(event){
    	parent = this.parentElement;
    	while (parent.tagName.toLowerCase() != 'table') {
    		parent = parent.parentElement
    	}
    	if (this.checked) {
    		$(parent).find('[type="checkbox"]').prop("checked", true);
    	} else {
    		$(parent).find('[type="checkbox"]').prop("checked", false);
    		$(parent).find('[type="checkbox"]').removeAttr("checked");
    	}
    });
    $('.mass-checkbox, .table-checkall').prop('checked', false);
    $('.mass_checkbox, .table-checkall').removeAttr('checked');
    function getMassSelectedCheckbox() {
    	var mass_checkbox = document.getElementsByClassName('mass-checkbox');
    	var i, n = mass_checkbox.length;
    	resource_ids = [];
    	if (n > 0) {
	    	for (i = 0 ; i < n ; i++){
	    		if(mass_checkbox[i].checked) {
	    			resource_ids.push(mass_checkbox[i].value)
	    		} else {
	    			var index = resource_ids.indexOf(mass_checkbox[i].value);
	    			if (index != -1) {
	    				resource_ids.slice(index, 1);
	    			}
	    		}
	    	}
    	}
    	return resource_ids;
    }
    $(".table-checkall, .mass-checkbox").change(function(event){
    	resource_ids = getMassSelectedCheckbox();
    	if (resource_ids.length > 0) {
    		$(".mass-lo-action:not(.single)").removeClass("disabled");
    		$(".mass-lo-action:not(.single)").removeAttr("disabled");

    		$(".mass-user-action:not(.single)").removeClass("disabled");
    		$(".mass-user-action:not(.single)").removeAttr("disabled");
    	} else {
    		$(".mass-lo-action:not(.single)").addClass("disabled");
    		$(".mass-lo-action:not(.single)").attr("disabled", "disabled");

    		$(".mass-user-action:not(.single)").addClass("disabled");
    		$(".mass-user-action:not(.single)").attr("disabled", "disabled");
    	}
    })
    function massActionRequest(_id, owner, action) {
    	var url = '';
    	if (action == 'remove') {
    		url = '/admin/learning-object/remove';
    	} else {
    		url = '/admin/learning-object/set-approve';
    	}
		$.post(url,
			{
				_id,
				owner,
				status: action == 'approve' ? true : false
			}, function(data, textStatus, xhr) {
			if (data.ok == 1) {
				var text = action == 'approve' ? 'Habilitado' : 'Desabilitado';
				for (var i = _id.length - 1; i >= 0; i--) {
					$('#' + _id[i])
					.find('.badge')
					.toggleClass('alert-danger alert-success')
					.text(text);
				}
				$('.table-checkall').prop('checked', false).trigger('change');
				alert('Ação realizada com sucesso!');
			}
		});
    }
    $(".mass-lo-action").click(function(){
    	var resource_ids = $(this).data('id') ? [$(this).data('id')] : getMassSelectedCheckbox();
    	var user = $(this).data('user') || null;
    	var action = $(this).data('action');
    	    
    	if ($(this).data('confirm')) {
    		if (confirm("Tem certeza")) {
    			massActionRequest(resource_ids, user, action);
    		}
    	} else {
    		massActionRequest(resource_ids, user, action);
    	}	
    });
    $(".mass-user-action").click(function(event){
    	event.preventDefault();
    	var resource_ids = $(this).data('id') ? [$(this).data('id')] : getMassSelectedCheckbox();
    	var url = '';
    	var action = $(this).data('action');
    	if (action == 'remove') {
    		url = '/admin/user/massRemove';
    	} else if(action == 'authorize') {
    		url = '/admin/user/massAuthorize';
    	} else {
    		url = '/admin/user/massUnauthorize';
    	}
    	if (action == 'remove') {
    		if (!confirm("Tem certeza?")) {
    			return;
    		}
    	}
    	$.post(url,
			{
				resource_ids				
			}, function(data, textStatus, xhr) {
			console.log(xhr)
			if(xhr.status == 200) {
				window.location.reload()
			}
		});
    })
    var lic_objects = document.getElementById('license-objects');
	var lic_details = document.getElementById('license-details');
	
	if (lic_objects) {	
		lic_objects = JSON.parse(lic_objects.value);
		
		var lookup = {};
		for (var i = 0, len = lic_objects.length; i < len; i++) {
		    lookup[lic_objects[i]._id] = lic_objects[i];
		}

		var lic_img = document.getElementById('license-img');
		var lic_deed = document.getElementById('license-deed');
		var lic_legal = document.getElementById('license-legal');
		load_license_details($("[name=license]"));
		$("[name=license]").change(function(){
			load_license_details($(this));
		})
		function load_license_details(select) {
			var selected = select.find(':selected').val();
			selected = lookup[selected]
			var description = selected.description || null;
			console.log(description)
			$("#license_description").text(description);
			if (description) {
				lic_img.src = selected.image;
				lic_img.alt = selected.name;
				lic_deed.href = selected.deed;
				lic_legal.href = selected.legal;
				lic_details.style.display = 'block'
			} else {
				lic_details.style.display = 'none'
			}

		}
	}
});