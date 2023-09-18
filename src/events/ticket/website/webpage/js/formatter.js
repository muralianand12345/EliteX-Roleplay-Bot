$(document).ready(function () {

    $("#convert").click(function () {
        rawValue = $("#raw_data").val();

        var lines = "";
        $.each(rawValue.split(/\n/), function (i, line) {
            d = line.split(":");
            // if(line.indexOf("Name")>-1 || line.indexOf("citizenid")>-1){
            if (line.indexOf("Name") > -1) {
                val = d[1].trim();
                val = val.replace(',', ' ');
                lines += val + ",";

            }
            if (line.indexOf("Shift duration") > -1) {

                val = d[1].trim();
                if (val.indexOf("seconds") > -1) {
                    val = '';
                }

                if (val.indexOf("hours") > -1 && val.indexOf("minutes") > -1) {

                    sp = val.split(",");
                    h = sp[0].replace('hours', '');
                    h = h.trim();
                    if (h.toString().length < 2) {
                        h = '0' + h;
                    }
                    m = sp[1].replace('minutes', '');
                    m = m.trim();
                    m = Math.round(m);

                    if (m.toString().length < 2) {
                        m = '0' + m;
                    }
                    val = h + ":" + m + ":00";
                    val = val.trim();
                }
                if (val.indexOf("minutes") > -1) {
                    val = val.replace('minutes', '');
                    val = parseInt(val);
                    if (val.toString().length < 2) {
                        val = '0' + val;

                    }
                    val = "00:" + val + ":00";
                    val = val.trim();
                }
                lines += val + ",";

            }
            if (line.indexOf("Start date") > -1) {

                dd = line.split(" ");
                mm = dd[2].split("/");
                lines += mm[1] + "/" + mm[0] + "/" + mm[2] + ",";
                lines += mm[1] + "/" + mm[0] + "/" + mm[2] + " " + dd[3] + ",";
            }
            if (line.indexOf("End date") > -1) {
                dd = line.split(" ");
                mm = dd[2].split("/");
                lines += mm[1] + "/" + mm[0] + "/" + mm[2] + " " + dd[3] + "\n";
            }

        });
        $("#processed_data").val(lines)
    });
});