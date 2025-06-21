// 右键菜单管理
$("cvs").addEventListener("contextmenu", (event) => {
	console.log(event);
	event.preventDefault();
	let menu = $("contextmenu");
	menu.style.display = "block";
	menu.style.left = event.pageX + "px";
	menu.style.top = event.pageY + "px";
});
document.addEventListener("click", (event) => {
	$("contextmenu").style.display = "none";
});

{
	let change_note = (type) => {
		for(let i=0; i<selection.length; i++) {
			let nt = note_extract(notes[selection[i]]);
			if(nt.type != 2) {
				nt.type = type;
				notes[selection[i]] = note_compress(nt);
			}
		}
		notecontrol.update();
	}
	$("contextmenu-toTap").addEventListener("click", () => change_note(1));
	$("contextmenu-toDrag").addEventListener("click", () => change_note(4));
	$("contextmenu-toFlick").addEventListener("click", () => change_note(3));
}
$("contextmenu-filp").addEventListener("click", () => {
	for(let i=0; i<selection.length; i++) {
		let nt = note_extract(notes[selection[i]]);
		nt.positionX = -nt.positionX;
		notes[selection[i]] = note_compress(nt);
	}
	notecontrol.update();
});
