import React,{useEffect,useState}from'react';import{Routes,Route,Navigate,useNavigate,NavLink}from'react-router-dom';import api from'./api';
const initials=n=>(n||'U').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
function Login({onLogin}){const[email,setEmail]=useState('hr@staffsync.demo'),[password,setPassword]=useState('StaffSync123!'),[error,setError]=useState(''),[loading,setLoading]=useState(false);async function submit(e){e.preventDefault();setLoading(true);setError('');try{const{data}=await api.post('/auth/login',{email,password});localStorage.setItem('staffsync_token',data.token);onLogin(data.user);}catch(e){setError(e.response?.data?.message||'Unable to sign in. Check API and database.');}finally{setLoading(false)}}return <div className="login-page"><div className="login-art"><div className="brand"><span className="brand-mark"><i className="bi bi-people-fill"/></span> StaffSync</div><div className="art-copy"><span className="eyebrow">PEOPLE FIRST. ALWAYS.</span><h1>Great teams<br/>start with <em>great people.</em></h1><p>Your people, processes, and possibilities — all in one workspace.</p><div className="art-stats"><div><b>01</b><span>People</span></div><div><b>02</b><span>Culture</span></div><div><b>03</b><span>Growth</span></div></div></div><div className="art-bottom">© 2026 StaffSync · Human, by design</div></div><div className="login-form-wrap"><form className="login-form" onSubmit={submit}><span className="eyebrow">WELCOME BACK</span><h2>Sign in to your workspace</h2><p className="muted">Enter your details to access your dashboard.</p>{error&&<div className="alert alert-danger py-2">{error}</div>}<label>Email address</label><input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/><label>Password</label><input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="btn btn-primary w-100 mt-3" disabled={loading}>{loading?'Signing in…':'Sign in'} <i className="bi bi-arrow-right ms-2"/></button><div className="demo-box"><b>Demo accounts</b><span>HR: hr@staffsync.demo</span><span>Manager: manager@staffsync.demo</span><span>Employee: employee@staffsync.demo</span><small>Password: StaffSync123!</small></div></form></div></div>}
function App(){const[user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('staffsync_user'))}catch{return null}});const[page,setPage]=useState('Dashboard'),[collapsed,setCollapsed]=useState(false),[data,setData]=useState({}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(''),[modal,setModal]=useState(''),[form,setForm]=useState({}),[search,setSearch]=useState('');const nav=useNavigate();const role=user?.role||'Employee';function logout(){localStorage.removeItem('staffsync_token');localStorage.removeItem('staffsync_user');setUser(null);nav('/login');}function logged(u){setUser(u);localStorage.setItem('staffsync_user',JSON.stringify(u));nav('/');}
const [profileOpen, setProfileOpen] = useState(false);
async function load(){if(!user)return;setBusy(true);setError('');try{const endpoints={Dashboard:'/dashboard',Employees:'/employees',Leaves:'/leaves',Attendance:'/attendance',Announcements:'/announcements',Training:'/training',Notifications:'/notifications'};let keys=Object.keys(endpoints);let results=await Promise.allSettled(keys.map(k=>api.get(endpoints[k])));let next={};results.forEach((r,i)=>{if(r.status==='fulfilled')next[keys[i]]=r.value.data;});setData(next);}catch(e){setError(e.response?.data?.message||'Could not load data');}finally{setBusy(false)}}useEffect(()=>{load()},[user]);useEffect(()=>{if(user){const t=setInterval(()=>api.get('/notifications').then(r=>setData(d=>({...d,Notifications:r.data}))).catch(()=>{}),45000);return()=>clearInterval(t)}},[user]);
const navItems=[['Dashboard','bi-grid-1x2'],...(role!=='Employee'?[['Employees','bi-people']]:[]),['Leaves','bi-calendar2-week'],['Attendance','bi-clock-history'],['Announcements','bi-megaphone'],['Training','bi-mortarboard'],['Notifications','bi-bell']];const d=data.Dashboard||{};const list=Array.isArray(data[page])?data[page]:[];const filtered=list.filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));
async function action(method,url,payload,msg){try{setError('');await api[method](url,payload);setSuccess(msg||'Changes saved successfully');setModal('');setForm({});await load();setTimeout(()=>setSuccess(''),4000);}catch(e){setError(e.response?.data?.message||'Action failed');}}
function openModal(kind,item={}){setModal(kind);setForm(item?{...item}:{});}
function field(k,v){setForm(f=>({...f,[k]:v}));}
function submitModal(e){e.preventDefault();if(modal==='employee'){const body={...form};delete body._id;delete body.__v;action(form._id?'patch':'post',form._id?`/employees/${form._id}`:'/employees',body,form._id?'Employee updated':'Employee added');}else if(modal==='announcement')action('post','/announcements',form,'Announcement published');else if(modal==='training')action('post','/training',form,'Training program created');else if(modal==='leave')action('post','/leaves',form,'Leave request submitted');}
if(!user)return <Routes><Route path="/login" element={<Login onLogin={logged}/>}/><Route path="*" element={<Navigate to="/login" replace/>}/></Routes>;
return <div className={`app-shell ${collapsed?'sidebar-collapsed':''}`}><aside className="sidebar"><div className="brand"><span className="brand-mark"><i className="bi bi-people-fill"/></span><span>StaffSync</span><button className="sidebar-toggle" onClick={()=>setCollapsed(!collapsed)}><i className="bi bi-layout-sidebar-inset"/></button></div><div className="workspace-label">WORKSPACE</div><nav>{navItems.map(([name,icon])=><button key={name} className={`nav-item ${page===name?'active':''}`} onClick={()=>{setPage(name);setSearch('')}}><i className={`bi ${icon}`}/><span>{name}</span>{name==='Notifications'&&data.Notifications?.filter(n=>!n.read).length>0&&<small>{data.Notifications.filter(n=>!n.read).length}</small>}</button>)}</nav><div className="sidebar-bottom"><div className="help-card"><i className="bi bi-life-preserver"/><b>Need a hand?</b><span>Visit the people ops team.</span></div><button className="profile-mini" onClick={logout}><span className="avatar">{initials(user.name)}</span><span className="profile-text"><b>{user.name}</b><small>{role}</small></span><i className="bi bi-box-arrow-right"/></button></div></aside><main className="main-area"><header className="topbar"><div className="crumb"><span>Workspace</span><i className="bi bi-chevron-right"/><b>{page}</b></div><div className="top-actions"><button className="icon-btn" onClick={()=>setPage('Notifications')} title="Notifications"><i className="bi bi-bell"/>{data.Notifications?.some(n=>!n.read)&&<span className="ping"/>}</button><span className="top-divider"/>
<div className="profile-menu">

  <button
    className="user-chip"
    onClick={() => setProfileOpen(!profileOpen)}
  >
    <span className="avatar">
      {initials(user.name)}
    </span>

    <span>
      <b>{user.name}</b>
      <small>{role}</small>
    </span>

    <i className="bi bi-chevron-down"/>
  </button>

  {profileOpen && (
    <div className="profile-dropdown">

      <div className="dropdown-user">
        <span className="avatar">
          {initials(user.name)}
        </span>

        <span>
          <b>{user.name}</b>
          <small>{user.email}</small>
        </span>
      </div>

      <div className="dropdown-divider"/>

      <button
        className="dropdown-item"
        onClick={() => {
          setProfileOpen(false);
          logout();
        }}
      >
        <i className="bi bi-box-arrow-right"/>
        Logout
      </button>

    </div>
  )}

</div>
</div></header><div className="content"><div className="page-heading"><div><span className="eyebrow">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</span><h1>{page==='Dashboard'?`Good ${new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening'}, ${user.name.split(' ')[0]}`:page}</h1><p>{page==='Dashboard'?'Here’s what’s happening across your people today.':page==='Employees'?'Your people directory, all in one place.':page==='Leaves'?'Manage time off and keep your team moving.':page==='Attendance'?'Daily attendance and time records.':page==='Announcements'?'Company updates and important messages.':page==='Training'?'Build skills and grow together.':'Stay up to date with your workspace.'}</p></div><div className="heading-actions"><button className="btn btn-light refresh" onClick={load}><i className={`bi bi-arrow-clockwise ${busy?'spin':''}`}/> Refresh</button>{role==='HR'&&page==='Employees'&&<button className="btn btn-primary" onClick={()=>openModal('employee',{})}><i className="bi bi-plus-lg"/> Add employee</button>}{role==='HR'&&page==='Announcements'&&<button className="btn btn-primary" onClick={()=>openModal('announcement',{})}><i className="bi bi-plus-lg"/> New announcement</button>}{['HR','Manager'].includes(role)&&page==='Training'&&<button className="btn btn-primary" onClick={()=>openModal('training',{})}><i className="bi bi-plus-lg"/> Create training</button>}{role==='Employee'&&page==='Leaves'&&<button className="btn btn-primary" onClick={()=>openModal('leave',{})}><i className="bi bi-plus-lg"/> Apply for leave</button>}
{role === 'Employee' && page === 'Attendance' && (() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecord = list.find(a => {
    const attendanceDate = new Date(a.date);
    attendanceDate.setHours(0, 0, 0, 0);
    return attendanceDate.getTime() === today.getTime();
  });

  if (!todayRecord) {
    return (
      <button
        className="btn btn-primary"
        onClick={() =>
          action(
            'post',
            '/attendance',
            {},
            'Check In successful'
          )
        }
      >
        <i className="bi bi-box-arrow-in-right" />
        Check In
      </button>
    );
  }

  if (!todayRecord.checkOut) {
    return (
      <button
        className="btn btn-primary"
        onClick={() =>
          action(
            'post',
            '/attendance/checkout',
            {},
            'Check Out successful'
          )
        }
      >
        <i className="bi bi-box-arrow-right" />
        Check Out
      </button>
    );
  }

  return (
    <button className="btn btn-light" disabled>
      <i className="bi bi-check-circle" />
      Completed for today
    </button>
  );
})()}
</div></div>{error&&<div className="alert alert-danger py-2">{error}<button className="float-end btn-close" onClick={()=>setError('')}/></div>}{success&&<div className="alert alert-success py-2">{success}</div>}
{page==='Dashboard'?<Dashboard role={role} user={user} d={d} data={data} setPage={setPage} openModal={openModal}/>:page==='Employees'?<><div className="toolbar"><div className="search-box"><i className="bi bi-search"/><input placeholder="Search employees…" value={search} onChange={e=>setSearch(e.target.value)}/></div><span className="results-count">{filtered.length} people</span></div><div className="panel table-panel"><div className="panel-header"><div><h3>People directory</h3><p>Employee records and team details</p></div><span className="tag">{filtered.length} employees</span></div><div className="table-responsive"><table className="table"><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>POSITION</th><th>STATUS</th>{role==='HR'&&<th/>}</tr></thead><tbody>{filtered.map(e=><tr key={e._id}><td><div className="employee-cell"><span className="avatar avatar-soft">{initials(e.name)}</span><span><b>{e.name}</b><small>{e.email}</small></span></div></td><td>{e.department||'—'}</td><td>{e.position||'—'}</td><td><span className={`status ${e.status==='Active'?'status-green':'status-gray'}`}>{e.status}</span></td>
{role === 'HR' && (
  <td>
    <div className="row-actions">

      {/* Edit employee */}
      <button
        onClick={() => openModal('employee', e)}
        title="Edit"
      >
        <i className="bi bi-pencil" />
      </button>

      
{/* Activate / Deactivate employee */}
<button
  onClick={() => {
    const newStatus =
      e.status === "Active" ? "Inactive" : "Active";

    const actionName =
      newStatus === "Active" ? "Activate" : "Deactivate";

    if (confirm(`${actionName} ${e.name}?`)) {
      action(
        "patch",
        `/employees/${e._id}`,
        { status: newStatus },
        `Employee ${newStatus === "Active" ? "activated" : "deactivated"}`,
      );
    }
  }}
  title={
    e.status === "Active"
      ? "Deactivate employee"
      : "Activate employee"
  }
>
  <i
    className={`bi ${
      e.status === "Active"
        ? "bi-person-x"
        : "bi-person-check"
    }`}
  />
</button>


      {/* Delete employee */}
      <button
        onClick={() => {
          if (confirm(`Delete ${e.name}?`)) {
            action(
              'delete',
              `/employees/${e._id}`,
              undefined,
              'Employee deleted'
            );
          }
        }}
        title="Delete"
      >
        <i className="bi bi-trash" />
      </button>

    </div>
  </td>
)}
</tr>)}</tbody></table>{filtered.length===0&&<Empty text="No employees found"/>}</div></div></>:page==='Leaves'?<div className="panel table-panel"><div className="panel-header"><div><h3>Leave requests</h3><p>Review and track time off</p></div><span className="tag">{list.length} requests</span></div><div className="table-responsive"><table className="table"><thead><tr><th>EMPLOYEE</th><th>TYPE</th><th>DATES</th><th>DAYS</th><th>STATUS</th>{role!=='Employee'&&<th>ACTIONS</th>}</tr></thead><tbody>{list.map(l=><tr key={l._id}><td><b>{l.employee?.name||user.name}</b><small className="subcell">{l.employee?.employeeId||''}</small></td><td>{l.type}</td><td>{fmt(l.startDate)} – {fmt(l.endDate)}</td><td>{l.days||'—'}</td><td><Status value={l.status}/></td>{role!=='Employee'&&<td>{l.status==='Pending'?<div className="row-actions"><button className="approve" onClick={()=>action('patch',`/leaves/${l._id}/review`,{status:'Approved'},'Leave approved')}><i className="bi bi-check2"/></button><button className="reject" onClick={()=>action('patch',`/leaves/${l._id}/review`,{status:'Rejected'},'Leave rejected')}><i className="bi bi-x"/></button></div>:<span className="muted">Reviewed</span>}</td>}</tr>)}</tbody></table>{!list.length&&<Empty text="No leave requests yet"/>}</div></div>:page==='Attendance'?<div className="panel table-panel"><div className="panel-header"><div><h3>Attendance records</h3><p>Check-in and check-out activity</p></div><span className="tag">{list.length} records</span></div><div className="table-responsive"><table className="table"><thead><tr><th>EMPLOYEE</th><th>DATE</th><th>CHECK IN</th><th>CHECK OUT</th><th>STATUS</th></tr></thead><tbody>{list.map(a=><tr key={a._id}><td><b>{a.employee?.name||user.name}</b></td><td>{fmt(a.date)}</td><td>{a.checkIn?new Date(a.checkIn).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'}</td><td>{a.checkOut?new Date(a.checkOut).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'}</td><td><Status value={a.status}/></td></tr>)}</tbody></table>{!list.length&&<Empty text="No attendance records yet"/>}</div></div>:page==='Announcements'?<div className="announcement-grid">{list.map(a=><article className="announcement-card" key={a._id}><div className="announce-icon"><i className="bi bi-megaphone"/></div><div className="announce-meta"><span className="tag">{a.category}</span><small>{fmt(a.createdAt)}</small></div><h3>{a.title}</h3><p>{a.content}</p><div className="announce-author"><span className="avatar avatar-soft">{initials(a.author?.name||'HR')}</span><span><b>{a.author?.name||'People team'}</b><small>StaffSync</small></span></div></article>)}{!list.length&&<Empty text="No announcements yet"/>}</div>:page==='Training'?<div className="training-grid">{list.map(t=><article className="training-card" key={t._id}><div className="training-top"><span className="training-icon"><i className="bi bi-mortarboard"/></span><span className="tag">{t.department||'All teams'}</span></div><h3>{t.title}</h3><p>{t.description||'A learning opportunity to build new skills and grow together.'}</p><div className="training-details"><span><i className="bi bi-calendar3"/> {fmt(t.date)}</span><span><i className="bi bi-clock"/> {t.durationHours||1} hour(s)</span></div><div className="training-footer"><span>{t.enrolled?.length||0}{t.capacity?` / ${t.capacity}`:''} enrolled</span>{role==='Employee'&&<button className="btn btn-outline-primary btn-sm" onClick={()=>action('post',`/training/${t._id}/enroll`,{},'You enrolled in training')}>Enroll <i className="bi bi-arrow-right"/></button>}</div></article>)}{!list.length&&<Empty text="No training programs available"/>}</div>:<div className="notification-list">{list.map(n=><article className={`notification-item ${n.read?'':'unread'}`} key={n._id}><span className="notification-icon"><i className={`bi ${n.type==='announcement'?'bi-megaphone':'bi-bell'}`}/></span><div><b>{n.title}</b><p>{n.message}</p><small>{new Date(n.createdAt).toLocaleString()}</small></div>{!n.read&&<button className="btn btn-sm btn-light" onClick={()=>action('patch',`/notifications/${n._id}/read`,{},'Notification marked as read')}>Mark read</button>}</article>)}{!list.length&&<Empty text="You're all caught up"/>}</div>}
<div className="footer-note">StaffSync <span>·</span> Made for people, powered by purpose <span className="footer-dot"/></div></div></main>{modal&&<Modal kind={modal} form={form} field={field} close={()=>setModal('')} submit={submitModal}/>}</div>}
function fmt(v){return v?new Date(v).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}function Status({value}){return <span className={`status ${value==='Approved'||value==='Present'?'status-green':value==='Pending'||value==='Late'?'status-amber':value==='Rejected'||value==='Absent'?'status-red':'status-gray'}`}>{value}</span>}function Empty({text}){return <div className="empty"><i className="bi bi-inbox"/><b>{text}</b><span>When there’s something to show, it’ll appear here.</span></div>}
function Dashboard({role,user,d,data,setPage,openModal}){const[me,setMe]=useState(null);useEffect(()=>{api.get('/auth/me').then(r=>setMe(r.data.employee)).catch(()=>{})},[]);const stat=[{label:'Active employees',value:d.employees??'—',icon:'bi-people',tone:'blue',change:'People in your organization'}, {label:'Leave requests',value:d.leaves??'—',icon:'bi-calendar2-week',tone:'purple',change:`${d.pending??0} awaiting review`},{label:'Announcements',value:d.announcements??'—',icon:'bi-megaphone',tone:'orange',change:'Published updates'},{label:'Upcoming training',value:d.training??'—',icon:'bi-mortarboard',tone:'green',change:'Learning opportunities'}];return <><div className="stats-grid">{stat.map(s=><div className="stat-card" key={s.label}><div className={`stat-icon ${s.tone}`}><i className={`bi ${s.icon}`}/></div><span>{s.label}</span><strong>{s.value}</strong><small>{s.change}</small></div>)}</div><div className="dashboard-grid"><section className="panel overview-panel"><div className="panel-header"><div><h3>Quick overview</h3><p>Your workspace at a glance</p></div><span className="live"><span/> Live</span></div><div className="overview-rows"><button onClick={()=>setPage('Leaves')}><span className="overview-icon purple"><i className="bi bi-calendar-check"/></span><span><b>Leave management</b><small>Track requests and approvals</small></span><strong>{d.pending??0} pending</strong><i className="bi bi-chevron-right"/></button><button onClick={()=>setPage('Attendance')}><span className="overview-icon blue"><i className="bi bi-clock"/></span><span><b>Attendance</b><small>View attendance activity</small></span><strong>{d.attendanceToday??0} today</strong><i className="bi bi-chevron-right"/></button><button onClick={()=>setPage('Training')}><span className="overview-icon green"><i className="bi bi-book"/></span><span><b>Learning & development</b><small>Explore training programs</small></span><strong>{d.training??0} upcoming</strong><i className="bi bi-chevron-right"/></button></div></section><section className="panel shortcuts-panel"><div className="panel-header"><div><h3>Quick actions</h3><p>Get things done faster</p></div></div><div className="shortcut-grid">{role==='Employee'?<><button onClick={()=>openModal('leave',{})}><span className="shortcut-icon purple"><i className="bi bi-calendar-plus"/></span><b>Apply leave</b><small>Request time off</small></button><button onClick={()=>setPage('Attendance')}><span className="shortcut-icon blue"><i className="bi bi-clock"/></span><b>My attendance</b><small>View time records</small></button></>:<><button onClick={()=>setPage('Employees')}><span className="shortcut-icon blue"><i className="bi bi-person-plus"/></span><b>People directory</b><small>View team members</small></button><button onClick={()=>setPage('Leaves')}><span className="shortcut-icon purple"><i className="bi bi-calendar-check"/></span><b>Review leaves</b><small>Manage requests</small></button></>}{role==='HR'&&<button onClick={()=>openModal('announcement',{})}><span className="shortcut-icon orange"><i className="bi bi-megaphone"/></span><b>Announcement</b><small>Share an update</small></button>}{['HR','Manager'].includes(role)&&<button onClick={()=>openModal('training',{})}><span className="shortcut-icon green"><i className="bi bi-mortarboard"/></span><b>New training</b><small>Create a program</small></button>}</div></section></div><div className="dashboard-bottom"><section className="panel recent-panel"><div className="panel-header"><div><h3>Recent announcements</h3><p>Latest updates from your organization</p></div><button className="text-link" onClick={()=>setPage('Announcements')}>View all <i className="bi bi-arrow-up-right"/></button></div>{(data.Announcements||[]).slice(0,3).map(a=><div className="recent-ann" key={a._id}><span className="recent-icon"><i className="bi bi-megaphone"/></span><div><b>{a.title}</b><small>{a.category} · {fmt(a.createdAt)}</small></div><i className="bi bi-chevron-right"/></div>)}{!data.Announcements?.length&&<Empty text="No recent announcements"/>}</section><section className="panel profile-panel"><div className="panel-header"><div><h3>My profile</h3><p>Your employee information</p></div><span className="tag">{role}</span></div><div className="profile-large"><span className="avatar avatar-large">{initials(user.name)}</span><div><b>{user.name}</b><small>{me?.position||role}</small></div></div><div className="profile-info"><div><small>Employee ID</small><b>{me?.employeeId||user.employeeId||'—'}</b></div><div><small>Department</small><b>{me?.department||'—'}</b></div><div><small>Email</small><b>{user.email}</b></div></div></section></div></>}
function Modal({kind,form,field,close,submit}){const titles={employee:form._id?'Edit employee':'Add employee',announcement:'Create announcement',training:'Create training program',leave:'Apply for leave'};return <div className="modal-backdrop" onClick={close}><form className="modal-card" onSubmit={submit} onClick={e=>e.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">STAFFSYNC</span><h2>{titles[kind]}</h2></div><button type="button" className="icon-btn" onClick={close}><i className="bi bi-x-lg"/></button></div><div className="modal-body">{kind==='employee'?<><Input label="Full name" name="name" form={form} field={field} required/><Input label="Email address" name="email" type="email" form={form} field={field} required/><div className="form-row"><Input label="Department" name="department" form={form} field={field}/><Input label="Position" name="position" form={form} field={field}/></div><Input label="Phone" name="phone" form={form} field={field}/>{!form._id&&<><Select label="Role" name="role" options={['Employee','Manager','HR']} form={form} field={field}/><Input label="Temporary password" name="password" form={form} field={field} defaultValue="StaffSync123!"/></>}</>:kind==='announcement'?<><Input label="Announcement title" name="title" form={form} field={field} required/><Select label="Category" name="category" options={['General','HR','Event','Policy']} form={form} field={field}/><Select label="Audience" name="audience" options={['All','HR','Manager','Employee']} form={form} field={field}/><Textarea label="Message" name="content" form={form} field={field} required/></>:kind==='training'?<><Input label="Program title" name="title" form={form} field={field} required/><Textarea label="Description" name="description" form={form} field={field}/><div className="form-row"><Input label="Date" name="date" type="date" form={form} field={field} required/><Input label="Duration (hours)" name="durationHours" type="number" form={form} field={field}/></div><div className="form-row"><Input label="Trainer" name="trainer" form={form} field={field}/><Input label="Department" name="department" form={form} field={field}/></div><Input label="Location" name="location" form={form} field={field}/><Input label="Capacity" name="capacity" type="number" form={form} field={field}/></>:<><Select label="Leave type" name="type" options={['Annual','Sick','Personal','Other']} form={form} field={field}/><div className="form-row"><Input label="Start date" name="startDate" type="date" form={form} field={field} required/><Input label="End date" name="endDate" type="date" form={form} field={field} required/></div><Textarea label="Reason" name="reason" form={form} field={field} required/></>}</div><div className="modal-footer"><button type="button" className="btn btn-light" onClick={close}>Cancel</button><button type="submit" className="btn btn-primary">{kind==='leave'?'Submit request':kind==='employee'?(form._id?'Save changes':'Add employee'):kind==='training'?'Create program':'Publish announcement'} <i className="bi bi-arrow-right ms-1"/></button></div></form></div>}
function Input({label,name,type='text',form,field,required}){return <label className="field-label">{label}<input className="form-control" type={type} value={form[name]??''} onChange={e=>field(name,e.target.value)} required={required}/></label>}function Textarea({label,name,form,field,required}){return <label className="field-label">{label}<textarea className="form-control" rows="4" value={form[name]??''} onChange={e=>field(name,e.target.value)} required={required}/></label>}function Select({label,name,options,form,field}){return <label className="field-label">{label}<select className="form-select" value={form[name]??options[0]} onChange={e=>field(name,e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>}
export default App;
