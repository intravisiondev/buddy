export namespace backend {
	
	export class AuthResponse {
	    token: string;
	    user: any;
	
	    static createFrom(source: any = {}) {
	        return new AuthResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.token = source["token"];
	        this.user = source["user"];
	    }
	}
	export class Challenge {
	    id: string;
	    title: string;
	    participants: number;
	    ends_in: string;
	    reward: string;
	
	    static createFrom(source: any = {}) {
	        return new Challenge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.participants = source["participants"];
	        this.ends_in = source["ends_in"];
	        this.reward = source["reward"];
	    }
	}
	export class DashboardStats {
	    study_streak: number;
	    total_xp: number;
	    weekly_rank: number;
	    today_hours: number;
	    level: number;
	    weekly_xp: number;
	    gems: number;
	    tokens: number;
	    badges_earned: number;
	
	    static createFrom(source: any = {}) {
	        return new DashboardStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.study_streak = source["study_streak"];
	        this.total_xp = source["total_xp"];
	        this.weekly_rank = source["weekly_rank"];
	        this.today_hours = source["today_hours"];
	        this.level = source["level"];
	        this.weekly_xp = source["weekly_xp"];
	        this.gems = source["gems"];
	        this.tokens = source["tokens"];
	        this.badges_earned = source["badges_earned"];
	    }
	}

}

