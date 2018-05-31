jQuery(document).ready(function($) {
	if (document.getElementById('uploadcare-uploader')) {
		window.UPLOADCARE_PUBLIC_KEY = '1149ff0567d57aca2e74';
		UPLOADCARE_LOCALE = 'pt';			
		var singleWidget = uploadcare.SingleWidget('#uploadcare-uploader');		
		singleWidget.validators.push(function(fileInfo) {
		  if (fileInfo.size !== null && fileInfo.size > (10 * 1024 * 1024)) {
		    throw new Error("fileMaximumSize");
		  }
		});
		
		function setThumbnail(info) {
			if (info.isImage){
				$("#file-thumbnail").html(
					'<img class="img-responsive" title="' +info.name + '" alt="' +info.name + '" src="' +info.cdnUrl + '"/>'
				);
			} else {
				$("#file-thumbnail").html(
					'<img width="60" title="' +info.name + '" alt="' +info.name + '" src="/images/icons/' +info.name.replace(/^.*\.(.*)$/, '$1') + '.svg"/>'
				)
			}
		}		
		singleWidget.onUploadComplete(function(info) {			
			$.post('/learning-object/upload-file',
				{
					'_id': $("#_id").val(),
					'cdnUrl': info.cdnUrl,
					'isImage': info.isImage,
					'mimeType': info.mimeType,
					'name': info.name,
					'size': info.size,
					'uuid': info.uuid,
				}, function(data, textStatus, xhr) {
					$("#file-control").hide();
					if(textStatus == 'success') {								
						setThumbnail(info);
						$("#file-control").show();
					} else {
						console.log(data);
						console.log(textStatus);
					}							
				}
			);			
		});
		
		singleWidget.onChange(function(file) {			
			if (file) {
				file.done(function(info) {
					setThumbnail(info);
				});
			}
		});	

		$("#remove-file").click(function(event) {
			if(confirm('Tem certeza?')) {
				$("#loading").show();
				$.post('/learning-object/remove-file', {
					'_id': $("#_id").val(),
				}, function(data, textStatus, xhr) {
					if(textStatus == 'success') {
						alert("Arquivo removido com sucesso!");
						singleWidget.value(null);
						$("#file-thumbnail").html('');
						$("#file-control").hide();
					} else {
						alert("Falha ao remover o arquivo!");
					}
					$("#loading").hide();
				});
			}
		});
		singleWidget.onDialogOpen(function(dialogApi) {			
			$(".uploadcare--dialog_status_active .uploadcare--panel .uploadcare--button").get()[1].focus()
		});
	}
});