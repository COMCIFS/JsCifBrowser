# JsCifBrowser

The International Union of Crystallography (IUCr) maintain dictionaries of datanames for use in
crystallographic datafiles. These dictionaries are written in Dictionary Definition Languages (DDLs), 
with the most modern DDL being DDLm. DDLm dataname definitions may additionally contain algorithms
written in dREL describing how the defined dataname can be calculated from other items in the dictionary.

This software is a browser-based interface to the DDLm/dREL system.

Note that this software is not fully compatible with the version of DDLm used in the IUCr
dictionaries. Likewise, this software works with an earlier version of dREL and will not recognise
features of dREL added since 2012, such as `missing`, `null`, and certain builtin functions
and implicit row access conventions.

# How to Use

After cloning the repository, point your browser at 'readme.html' in the 'www' directory.
