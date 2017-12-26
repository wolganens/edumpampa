jQuery(document).ready(function($) {
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