<?php 
class User_model extends CI_Model{
	function __construct(){
		parent::__construct();
	}

	public function isCellphoneDuplicated($cellphone){
		$query = $this->db->query("SELECT * FROM user WHERE cellphone = '$cellphone'");
		if($query->num_rows() == 0)
			return FALSE;
		else
			return TRUE;
	}

	public function isUsernameDuplicated($username){
		$query = $this->db->query("SELECT * FROM user WHERE username = '$username'");
		if($query->num_rows() == 0)
			return FALSE;
		else
			return TRUE;
	}

	public function isEmailDuplicated($email){
		$query = $this->db->query("SELECT * FROM user WHERE email = '$email'");
		if($query->num_rows() == 0)
			return FALSE;
		else
			return TRUE;
	}

	public function isCellphonePasswordMatched($input){
		$cellphone = $input['cellphone'];
		$password = $input['password'];
		$query = $this->db->query("SELECT * FROM user WHERE cellphone = '$cellphone' AND password = SHA1('$password')");
		if($query->num_rows() == 0)
			return FALSE;
		else
			return TRUE;
	}


	public function processLogin($cellphone){
		$query = $this->db->query("SELECT * FROM user WHERE cellphone = '$cellphone'");
		$row = $query->first_row();
		$user_info = array(
			'user_id' => $row->id ,
			'name' => $row->username ,
			'cellphone' => $row->cellphone 
			);
		$this->session->set_userdata($user_info);
	}

	public function create($input){
		$username = isset($input['username']) && !empty($input['username']) ? $input['username'] : '' ;
		if(empty($username)){
			return array(FALSE , 'register fail');
		}
		$cellphone = $input['cellphone'];
		$password = $input['password'];
		$corpid = isset($input['corpid']) && !empty($input['corpid']) ? $input['corpid'] : null;
		$userid = isset($input['userid']) && !empty($input['userid']) ? $input['userid'] : null;
		$create_time = date('Y-m-d H:i:s');
		$query = $this->db->query("INSERT INTO user(username,cellphone,password,userid,corpid,create_time) VALUE ( '$username' , '$cellphone' , SHA1('$password') , '$userid' , '$corpid' , '$create_time' )");
		return array(TRUE , 'register success');
	}

	public function init($fx_host)
	{
		if(isset($this->host_list[$fx_host]))
		{
			$this->fx_host = $fx_host;
			$this->url = $this->host_list[$fx_host]['url'];
			$this->token = $this->host_list[$fx_host]['token'];
			return TRUE;
		}
		else
		{
			return FALSE;
		}
	}

	public function exec($method,$arr = NULL)
	{
		$param =($arr==NULL)?NULL:http_build_query($arr);
		$url = $this->url.$method."?token=".$this->token."&".$param;
		$content = file_get_contents($url);
		return json_decode($content);
	}


	public function getUserInfo($user_id){
		$query = $this->db->query("SELECT * FROM user WHERE id = $user_id");
		$row = $query->first_row('array');
		return $row;
	}

	public function getUserBooks($user_id){
		$query = $this->db->query("SELECT * FROM item WHERE id = $user_id");
		$result = $query->result('array');
		return $result;
	}

	public function updateProfile($data , $user_id){
		$this->db->where('id', $user_id);
		$this->db->update('user', $data); 
		return TRUE;
	}

	public function changePwd($input , $user_id){
		$cpwd = $input['cpwd'];
		$npwd1 = $input['npwd1'];
		$npwd2 = $input['npwd2'];

		if(empty($cpwd) OR empty($npwd1) OR empty($npwd2) )
			return 1;

		if($npwd1 != $npwd2)
			return 2;

		if($npwd1 == $cpwd)
			return 3;

		$query_user = $this->db->query("SELECT * FROM user WHERE id=$user_id AND password=SHA1('$cpwd')");
		if($query_user->num_rows() == 0)
			return 4;

		$update_pwd = $this->db->query("UPDATE user SET password=SHA1('$npwd1') WHERE id=$user_id");
		return 5;
	}
}

