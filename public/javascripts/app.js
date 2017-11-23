jQuery(document).ready(function($) {	
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
				dictFileTooBig: "Arquivo muito grande! Você pode enviar arquivos de até {{maxFilesize}} MB"
			}
		);	
		dropzone_hndlr.on("removedfile", function(file) {		
			$.post('/learning-object/remove-file', 
				{
					file_name: file.name ? file.name : file.upload.filename,
					object_id: $("#object_id").val()
				}, function(data, textStatus, xhr) {
				if (data.success) {				
					var lastUploaded = JSON.parse($("#file_name").val());
					if (lastUploaded) {
						if (lastUploaded.name == file.name || lastUploaded.name == file.upload.filename) {
							$("#file_name").val(null);
						}
					}				
				}
			});
		})
		dropzone_hndlr.on("success", function(file, data) {		
			$("#file_name").val(JSON.stringify(data.file));
		});
		dropzone_hndlr.on("addedfile", function(file, data) {		
			if (this.files[1] != null){
				alert("Você pode enviar apenas um arquivo!")
	        	this.removeFile(this.files[1]);        	
	        }	
		});	
		
		if ($("#file_name").val() != '') {					
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
		}
	}	
	var lic_details = document.getElementById('license-details');
	if (lic_details) {
		var lic_img = document.getElementById('license-img');
		var lic_deed = document.getElementById('license-deed');
		var lic_legal = document.getElementById('license-legal');
		load_license_details($("[name=license]"));
		$("[name=license]").change(function(){
			load_license_details($(this));
		})
		function load_license_details(select) {
			var selected = select.find(':selected');
			var description = selected.data("description") || null;
			$("#license_description").text(description);
			if (description) {
				lic_img.src = selected.data('img');
				lic_img.alt = selected.text()
				lic_deed.href = selected.data('deed');
				lic_legal.href = selected.data('legal');
				lic_details.style.display = 'block'
			} else {
				lic_details.style.display = 'none'
			}

		}
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
    var inputErrors = document.getElementById('input-errors');
    if(inputErrors) {
    	var jsonErrors = JSON.parse(inputErrors.textContent);    	
    	console.log(jsonErrors);
    	for (var inputName in jsonErrors.errors) {
    		var aux = null;
    		    	    		
    		var input = document.getElementsByName(inputName)[0];
    		if (input) {
    			input.insertAdjacentHTML('afterend', '<div class="alert alert-danger">'+jsonErrors.errors[inputName].message+'</div>');
    		}
    		console.log(input)
    	}
    }
    var messages = document.getElementById('messages');
    if (messages) {    	
    	messages.focus();
    }
});